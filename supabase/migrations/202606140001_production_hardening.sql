-- Production hardening: company verification, transfer codes, fee bounds and idempotent RPCs
alter table public.companies add column if not exists verified_at timestamptz;
alter table public.companies add column if not exists rejected_reason text;
alter table public.wallet_topups add column if not exists "transferCode" text;
create unique index if not exists idx_wallet_topups_transfer_code on public.wallet_topups("transferCode") where "transferCode" is not null;

alter table public.commission_settings add column if not exists "minCvUnlockFee" numeric(14,0) not null default 10000 check ("minCvUnlockFee" >= 0);
alter table public.commission_settings add column if not exists "maxCvUnlockFee" numeric(14,0) not null default 200000 check ("maxCvUnlockFee" >= "minCvUnlockFee");
update public.commission_settings set "minCvUnlockFee" = coalesce("minCvUnlockFee", 10000), "maxCvUnlockFee" = coalesce("maxCvUnlockFee", 200000) where id = 'default';

drop function if exists public.get_cv_unlock_quote(bigint);
create function public.get_cv_unlock_quote(p_company_id bigint)
returns table(balance numeric, commission_rate numeric, fee numeric, min_fee numeric, max_fee numeric)
language plpgsql security definer set search_path=public as $$
declare v_balance numeric(14,0); v_rate numeric(5,4); v_min numeric(14,0); v_max numeric(14,0);
begin
 insert into public.company_wallets("companyId",balance) values(p_company_id,0) on conflict("companyId") do nothing;
 select w.balance into v_balance from public.company_wallets w where w."companyId"=p_company_id;
 select least(0.02,greatest(0.01,"cvUnlockRate")), "minCvUnlockFee", "maxCvUnlockFee"
 into v_rate, v_min, v_max from public.commission_settings where id='default';
 if v_rate is null then v_rate := 0.015; end if;
 if v_min is null then v_min := 10000; end if;
 if v_max is null then v_max := 200000; end if;
 return query select v_balance, v_rate, least(v_max, greatest(v_min, round(v_balance * v_rate))), v_min, v_max;
end $$;

drop function if exists public.unlock_application_for_company(bigint, bigint, text);
create function public.unlock_application_for_company(p_company_id bigint, p_application_id bigint, p_actor_email text)
returns public.application_accesses
language plpgsql security definer set search_path=public as $$
declare
  v_app public.applications%rowtype;
  v_wallet public.company_wallets%rowtype;
  v_access public.application_accesses%rowtype;
  v_rate numeric(5,4);
  v_min numeric(14,0);
  v_max numeric(14,0);
  v_fee numeric(14,0);
  v_after numeric(14,0);
begin
  select * into v_app from public.applications where id=p_application_id and "companyId"=p_company_id;
  if not found then raise exception 'Không tìm thấy hồ sơ thuộc doanh nghiệp này.'; end if;

  select * into v_access from public.application_accesses where "companyId"=p_company_id and "applicationId"=p_application_id;
  if found then
    insert into public.data_access_logs("actorEmail","companyId","applicationId","dataType",purpose)
    values(p_actor_email,p_company_id,p_application_id,'candidate_identity','reopen_unlocked_application');
    return v_access;
  end if;

  insert into public.company_wallets("companyId",balance) values(p_company_id,0) on conflict("companyId") do nothing;
  select * into v_wallet from public.company_wallets where "companyId"=p_company_id for update;

  select least(0.02,greatest(0.01,"cvUnlockRate")), "minCvUnlockFee", "maxCvUnlockFee"
  into v_rate, v_min, v_max from public.commission_settings where id='default';
  if v_rate is null then v_rate := 0.015; end if;
  if v_min is null then v_min := 10000; end if;
  if v_max is null then v_max := 200000; end if;
  v_fee := least(v_max, greatest(v_min, round(v_wallet.balance * v_rate)));
  if v_wallet.balance < v_fee then raise exception 'Số dư ví không đủ để mở CV.'; end if;
  v_after := v_wallet.balance - v_fee;

  update public.company_wallets set balance=v_after where "companyId"=p_company_id;
  insert into public.application_accesses("companyId","applicationId","feeAmount","commissionRate","balanceBefore","balanceAfter","unlockedBy")
  values(p_company_id,p_application_id,v_fee,v_rate,v_wallet.balance,v_after,p_actor_email)
  returning * into v_access;
  insert into public.wallet_transactions("companyId",type,amount,"balanceBefore","balanceAfter","refType","refId",note)
  values(p_company_id,'cv_unlock_fee',-v_fee,v_wallet.balance,v_after,'application_access',v_access.id,'Phí mở CV ứng viên');
  insert into public.platform_revenues("companyId",source,amount,"refType","refId",note)
  values(p_company_id,'cv_unlock_fee',v_fee,'application_access',v_access.id,'Doanh thu phí mở CV');
  insert into public.audit_logs("actorEmail","actorRole",action,"entityType","entityId",metadata)
  values(p_actor_email,'company','unlock_application','application',p_application_id::text,jsonb_build_object('fee',v_fee,'rate',v_rate,'minFee',v_min,'maxFee',v_max));
  insert into public.data_access_logs("actorEmail","companyId","applicationId","dataType",purpose)
  values(p_actor_email,p_company_id,p_application_id,'candidate_identity','unlock_application');
  return v_access;
end $$;

drop function if exists public.confirm_company_subscription(bigint, text);
create function public.confirm_company_subscription(p_subscription_id bigint, p_actor_email text)
returns public.company_subscriptions
language plpgsql security definer set search_path=public as $$
declare v_sub public.company_subscriptions%rowtype; v_plan public.subscription_plans%rowtype;
begin
 select * into v_sub from public.company_subscriptions where id=p_subscription_id for update;
 if not found then raise exception 'Không tìm thấy gói đăng ký.'; end if;
 if v_sub.status='active' then return v_sub; end if;
 if v_sub.status not in ('pending_payment','waiting_admin_confirm') then raise exception 'Gói không ở trạng thái chờ xác nhận.'; end if;
 select * into v_plan from public.subscription_plans where id=v_sub.plan_id;
 update public.company_subscriptions
 set status='active', starts_at=coalesce(starts_at,now()), ends_at=coalesce(ends_at, now() + interval '1 day' * coalesce(v_plan.duration_days,30)), confirmed_by=p_actor_email, confirmed_at=now()
 where id=v_sub.id returning * into v_sub;
 update public.companies set status='verified', verified_at=coalesce(verified_at, now()) where id=v_sub."companyId" and status in ('pending','active','verified');
 insert into public.platform_revenues("companyId",source,amount,"refType","refId",note)
 values(v_sub."companyId",'package_payment',v_sub.amount,'company_subscription',v_sub.id,'Doanh thu mua gói đăng tuyển');
 insert into public.audit_logs("actorEmail","actorRole",action,"entityType","entityId",metadata)
 values(p_actor_email,'admin','confirm_subscription','company_subscription',v_sub.id::text,jsonb_build_object('amount',v_sub.amount));
 return v_sub;
end $$;
notify pgrst, 'reload schema';
