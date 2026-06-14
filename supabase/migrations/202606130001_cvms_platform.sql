-- CVMS hosted Supabase production schema
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;


-- compatibility for existing hosted schema
alter table if exists public.users add column if not exists "companyId" bigint;
alter table if exists public.users add column if not exists "companyRole" text;
alter table if exists public.users add column if not exists auth_user_id uuid;
alter table if exists public.users add column if not exists created_at timestamptz not null default now();
alter table if exists public.users add column if not exists updated_at timestamptz not null default now();
alter table if exists public.companies add column if not exists created_at timestamptz not null default now();
alter table if exists public.companies add column if not exists updated_at timestamptz not null default now();
alter table if exists public.jobs add column if not exists "companyId" bigint;
alter table if exists public.jobs add column if not exists "moderationNote" text;
alter table if exists public.jobs add column if not exists created_at timestamptz not null default now();
alter table if exists public.jobs add column if not exists updated_at timestamptz not null default now();
alter table if exists public.applications add column if not exists "companyId" bigint;
alter table if exists public.applications add column if not exists "jobId" bigint;
alter table if exists public.applications add column if not exists "jobTitle" text;
alter table if exists public.applications add column if not exists company text;
alter table if exists public.applications add column if not exists location text;
alter table if exists public.applications add column if not exists "userEmail" text;
alter table if exists public.applications add column if not exists "userName" text;
alter table if exists public.applications add column if not exists status text not null default 'M?i n?p';
alter table if exists public.applications add column if not exists "pipelineStage" text not null default 'new';
alter table if exists public.applications add column if not exists date text;
alter table if exists public.applications add column if not exists "dateTs" bigint;
alter table if exists public.applications add column if not exists "adminNote" text default '';
alter table if exists public.applications add column if not exists "aiScore" integer;
alter table if exists public.applications add column if not exists "aiFitLevel" text;
alter table if exists public.applications add column if not exists "aiEvaluation" jsonb;
alter table if exists public.applications add column if not exists "aiEvaluatedAt" text;

alter table if exists public.applications add column if not exists phone text;
alter table if exists public.applications add column if not exists "interviewAt" text;
alter table if exists public.applications add column if not exists "interviewNote" text;
alter table if exists public.applications add column if not exists created_at timestamptz not null default now();
alter table if exists public.applications add column if not exists updated_at timestamptz not null default now();
alter table if exists public.cvs add column if not exists "storageBucket" text not null default 'private-cvs';
alter table if exists public.cvs add column if not exists "storagePath" text;
alter table if exists public.cvs add column if not exists created_at timestamptz not null default now();
alter table if exists public.cvs add column if not exists updated_at timestamptz not null default now();
alter table if exists public.cvs add column if not exists base64 text;
alter table if exists public.cvs alter column base64 drop not null;

create table if not exists public.users (
  email text primary key,
  auth_user_id uuid unique,
  name text not null,
  password text,
  role text not null default 'user' check (role in ('user','company','admin')),
  "companyId" bigint,
  "companyRole" text,
  phone text, address text, bio text,
  "targetPosition" text, "experienceLevel" text, education text, skills text,
  "expectedSalary" text, "desiredLocations" text, "workType" text, portfolio text, linkedin text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id bigint primary key,
  name text not null,
  slug text unique,
  industry text,
  location text,
  plan text,
  status text not null default 'active' check (status in ('active','pending','paused','blocked')),
  "createdAt" text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.users drop constraint if exists users_company_fk;
alter table public.users add constraint users_company_fk foreign key ("companyId") references public.companies(id) on delete set null;

create table if not exists public.jobs (
  id bigint primary key,
  title text not null,
  company text not null,
  "companyId" bigint references public.companies(id) on delete cascade,
  location text not null,
  salary text,
  "salaryNum" integer not null default 0,
  deadline text,
  tags jsonb not null default '[]'::jsonb,
  dept text,
  qty integer not null default 1 check (qty > 0),
  applicants integer not null default 0 check (applicants >= 0),
  status text not null default 'Chờ kiểm duyệt',
  active boolean not null default false,
  "moderationNote" text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id bigint primary key,
  "jobId" bigint not null references public.jobs(id) on delete cascade,
  "companyId" bigint references public.companies(id) on delete cascade,
  "jobTitle" text not null,
  company text not null,
  location text not null,
  "userEmail" text not null references public.users(email) on delete cascade,
  "userName" text not null,
  phone text,
  status text not null default 'Mới nộp',
  "pipelineStage" text not null default 'new',
  date text, "dateTs" bigint,
  "adminNote" text default '',
  "aiScore" integer, "aiFitLevel" text, "aiEvaluation" jsonb, "aiEvaluatedAt" text,
  "sharedToCompany" boolean default false, "sharedAt" text, "companyShareNote" text,
  "companyFeedback" text, "companyFeedbackAt" text,
  "interviewAt" text, "interviewNote" text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique ("jobId", "userEmail")
);

create table if not exists public.saved_jobs (
  "userEmail" text not null references public.users(email) on delete cascade,
  "jobId" bigint not null references public.jobs(id) on delete cascade,
  "savedAt" text,
  primary key ("userEmail", "jobId")
);

create table if not exists public.notifications (
  id bigint primary key,
  role text not null check (role in ('user','company','admin')),
  "targetEmail" text,
  type text,
  title text not null,
  body text not null,
  "appId" bigint, "jobId" bigint, "companyId" bigint, "jobTitle" text, "userEmail" text,
  time text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cvs (
  email text primary key references public.users(email) on delete cascade,
  name text not null,
  type text,
  ext text,
  size bigint check (size is null or size >= 0),
  base64 text,
  "storageBucket" text not null default 'private-cvs',
  "storagePath" text,
  "uploadedAt" text,
  industries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint cvs_no_base64 check (base64 is null or base64 = '')
);

create table if not exists public.booking_requests (
  id bigint primary key,
  role text not null default 'company',
  "companyName" text not null, "contactName" text not null, email text not null, phone text,
  industry text, "packageKey" text, "packageLabel" text, "jobTitle" text,
  quantity integer default 1 check (quantity > 0), duration integer default 30 check (duration > 0),
  "totalAmount" bigint default 0 check ("totalAmount" >= 0), note text,
  status text default 'pending_payment', "paymentStatus" text default 'waiting_transfer',
  "paymentConfirmedAt" text, "adminConfirmedAt" text, "rejectedReason" text,
  "companyId" bigint references public.companies(id) on delete set null,
  "jobId" bigint references public.jobs(id) on delete set null,
  "createdAt" text, source text default 'public',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  price numeric(14,0) not null check (price >= 0),
  post_limit integer not null default 1 check (post_limit >= 0),
  duration_days integer not null default 30 check (duration_days > 0),
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.company_subscriptions (
  id bigint generated by default as identity primary key,
  "companyId" bigint not null references public.companies(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','waiting_admin_confirm','active','expired','cancelled','rejected')),
  amount numeric(14,0) not null check (amount >= 0),
  post_limit integer not null default 0,
  posts_used integer not null default 0 check (posts_used >= 0),
  starts_at timestamptz, ends_at timestamptz,
  requested_by text, confirmed_by text, confirmed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.company_wallets (
  "companyId" bigint primary key references public.companies(id) on delete cascade,
  balance numeric(14,0) not null default 0 check (balance >= 0),
  currency text not null default 'VND',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.wallet_topups (
  id bigint generated by default as identity primary key,
  "companyId" bigint not null references public.companies(id) on delete cascade,
  "requestedBy" text,
  amount numeric(14,0) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','refunded')),
  "transferNote" text,
  "confirmedBy" text,
  "confirmedAt" timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id bigint generated by default as identity primary key,
  "companyId" bigint not null references public.companies(id) on delete cascade,
  type text not null check (type in ('topup','cv_unlock_fee','refund','adjustment')),
  amount numeric(14,0) not null,
  "balanceBefore" numeric(14,0) not null check ("balanceBefore" >= 0),
  "balanceAfter" numeric(14,0) not null check ("balanceAfter" >= 0),
  "refType" text,
  "refId" bigint,
  note text,
  created_at timestamptz not null default now(),
  constraint wallet_tx_balance_math check ("balanceBefore" + amount = "balanceAfter")
);

create table if not exists public.commission_settings (
  id text primary key default 'default',
  "cvUnlockRate" numeric(5,4) not null default 0.015 check ("cvUnlockRate" between 0.01 and 0.02),
  "updatedBy" text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.application_accesses (
  id bigint generated by default as identity primary key,
  "companyId" bigint not null references public.companies(id) on delete cascade,
  "applicationId" bigint not null references public.applications(id) on delete cascade,
  "feeAmount" numeric(14,0) not null check ("feeAmount" >= 0),
  "commissionRate" numeric(5,4) not null check ("commissionRate" between 0.01 and 0.02),
  "balanceBefore" numeric(14,0) not null check ("balanceBefore" >= 0),
  "balanceAfter" numeric(14,0) not null check ("balanceAfter" >= 0),
  "unlockedBy" text,
  created_at timestamptz not null default now(),
  unique ("companyId", "applicationId")
);

create table if not exists public.platform_revenues (
  id bigint generated by default as identity primary key,
  "companyId" bigint references public.companies(id) on delete set null,
  source text not null check (source in ('package_payment','cv_unlock_fee','refund_adjustment')),
  amount numeric(14,0) not null,
  "refType" text, "refId" bigint,
  recognized_at timestamptz not null default now(),
  note text
);

create table if not exists public.refunds (
  id bigint generated by default as identity primary key,
  "companyId" bigint not null references public.companies(id) on delete cascade,
  amount numeric(14,0) not null check (amount > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  requested_by text, resolved_by text, resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id bigint generated by default as identity primary key,
  "companyId" bigint references public.companies(id) on delete set null,
  "applicationId" bigint references public.applications(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','rejected')),
  created_by text, resolved_by text, resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  "actorEmail" text, "actorRole" text, action text not null, "entityType" text, "entityId" text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.data_access_logs (
  id bigint generated by default as identity primary key,
  "actorEmail" text, "companyId" bigint, "applicationId" bigint,
  "dataType" text not null, purpose text,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (id,name,price,post_limit,duration_days,features) values
 ('basic','Basic',1500000,1,30,'{"support":"standard"}'::jsonb),
 ('standard','Standard',3500000,3,45,'{"support":"priority"}'::jsonb),
 ('priority','Priority',5900000,7,60,'{"support":"priority","highlight":true}'::jsonb)
on conflict (id) do update set name=excluded.name, price=excluded.price, post_limit=excluded.post_limit, duration_days=excluded.duration_days, features=excluded.features, updated_at=now();
insert into public.commission_settings (id,"cvUnlockRate") values ('default',0.015) on conflict (id) do nothing;

create index if not exists idx_users_company on public.users("companyId");
create index if not exists idx_jobs_company on public.jobs("companyId");
create index if not exists idx_applications_company on public.applications("companyId");
create index if not exists idx_applications_user on public.applications("userEmail");
create index if not exists idx_wallet_topups_company on public.wallet_topups("companyId", status);
create index if not exists idx_wallet_transactions_company on public.wallet_transactions("companyId", created_at desc);
create index if not exists idx_application_accesses_company on public.application_accesses("companyId", "applicationId");
create index if not exists idx_revenues_source on public.platform_revenues(source, recognized_at desc);
create index if not exists idx_disputes_status on public.disputes(status, created_at desc);
create index if not exists idx_refunds_status on public.refunds(status, created_at desc);

-- triggers
create or replace trigger trg_users_updated before update on public.users for each row execute function public.set_updated_at();
create or replace trigger trg_companies_updated before update on public.companies for each row execute function public.set_updated_at();
create or replace trigger trg_jobs_updated before update on public.jobs for each row execute function public.set_updated_at();
create or replace trigger trg_apps_updated before update on public.applications for each row execute function public.set_updated_at();
create or replace trigger trg_cvs_updated before update on public.cvs for each row execute function public.set_updated_at();
create or replace trigger trg_wallets_updated before update on public.company_wallets for each row execute function public.set_updated_at();

create or replace function public.confirm_wallet_topup(p_topup_id bigint, p_actor_email text)
returns public.wallet_topups language plpgsql security definer set search_path=public as $$
declare v_topup public.wallet_topups%rowtype; v_wallet public.company_wallets%rowtype; v_after numeric(14,0);
begin
 select * into v_topup from public.wallet_topups where id=p_topup_id for update;
 if not found then raise exception 'Không tìm thấy yêu cầu nạp ví.'; end if;
 if v_topup.status='confirmed' then return v_topup; end if;
 if v_topup.status <> 'pending' then raise exception 'Yêu cầu nạp ví không còn ở trạng thái chờ.'; end if;
 insert into public.company_wallets("companyId",balance) values(v_topup."companyId",0) on conflict("companyId") do nothing;
 select * into v_wallet from public.company_wallets where "companyId"=v_topup."companyId" for update;
 v_after := v_wallet.balance + v_topup.amount;
 update public.company_wallets set balance=v_after where "companyId"=v_topup."companyId";
 insert into public.wallet_transactions("companyId",type,amount,"balanceBefore","balanceAfter","refType","refId",note)
 values(v_topup."companyId",'topup',v_topup.amount,v_wallet.balance,v_after,'wallet_topup',v_topup.id,'Admin xác nhận nạp ví');
 update public.wallet_topups set status='confirmed', "confirmedBy"=p_actor_email, "confirmedAt"=now() where id=v_topup.id returning * into v_topup;
 insert into public.audit_logs("actorEmail","actorRole",action,"entityType","entityId",metadata) values(p_actor_email,'admin','confirm_wallet_topup','wallet_topup',v_topup.id::text,jsonb_build_object('companyId',v_topup."companyId",'amount',v_topup.amount));
 return v_topup;
end $$;

create or replace function public.get_cv_unlock_quote(p_company_id bigint)
returns table(balance numeric, commission_rate numeric, fee numeric) language plpgsql security definer set search_path=public as $$
declare v_balance numeric(14,0); v_rate numeric(5,4);
begin
 insert into public.company_wallets("companyId",balance) values(p_company_id,0) on conflict("companyId") do nothing;
 select w.balance into v_balance from public.company_wallets w where w."companyId"=p_company_id;
 select least(0.02,greatest(0.01,"cvUnlockRate")) into v_rate from public.commission_settings where id='default';
 if v_rate is null then v_rate := 0.015; end if;
 return query select v_balance, v_rate, greatest(1, round(v_balance * v_rate));
end $$;

create or replace function public.unlock_application_for_company(p_company_id bigint, p_application_id bigint, p_actor_email text)
returns public.application_accesses language plpgsql security definer set search_path=public as $$
declare v_app public.applications%rowtype; v_wallet public.company_wallets%rowtype; v_access public.application_accesses%rowtype; v_rate numeric(5,4); v_fee numeric(14,0); v_after numeric(14,0);
begin
 select * into v_app from public.applications where id=p_application_id and "companyId"=p_company_id;
 if not found then raise exception 'Không tìm thấy hồ sơ thuộc doanh nghiệp này.'; end if;
 select * into v_access from public.application_accesses where "companyId"=p_company_id and "applicationId"=p_application_id;
 if found then return v_access; end if;
 insert into public.company_wallets("companyId",balance) values(p_company_id,0) on conflict("companyId") do nothing;
 select * into v_wallet from public.company_wallets where "companyId"=p_company_id for update;
 select least(0.02,greatest(0.01,"cvUnlockRate")) into v_rate from public.commission_settings where id='default';
 if v_rate is null then v_rate := 0.015; end if;
 v_fee := greatest(1, round(v_wallet.balance * v_rate));
 if v_wallet.balance < v_fee then raise exception 'Số dư ví không đủ để mở CV.'; end if;
 v_after := v_wallet.balance - v_fee;
 update public.company_wallets set balance=v_after where "companyId"=p_company_id;
 insert into public.application_accesses("companyId","applicationId","feeAmount","commissionRate","balanceBefore","balanceAfter","unlockedBy")
 values(p_company_id,p_application_id,v_fee,v_rate,v_wallet.balance,v_after,p_actor_email) returning * into v_access;
 insert into public.wallet_transactions("companyId",type,amount,"balanceBefore","balanceAfter","refType","refId",note)
 values(p_company_id,'cv_unlock_fee',-v_fee,v_wallet.balance,v_after,'application_access',v_access.id,'Phí mở CV ứng viên');
 insert into public.platform_revenues("companyId",source,amount,"refType","refId",note)
 values(p_company_id,'cv_unlock_fee',v_fee,'application_access',v_access.id,'Doanh thu phí mở CV');
 insert into public.audit_logs("actorEmail","actorRole",action,"entityType","entityId",metadata) values(p_actor_email,'company','unlock_application','application',p_application_id::text,jsonb_build_object('fee',v_fee,'rate',v_rate));
 insert into public.data_access_logs("actorEmail","companyId","applicationId","dataType",purpose) values(p_actor_email,p_company_id,p_application_id,'candidate_identity','unlock_application');
 return v_access;
end $$;

create or replace function public.confirm_company_subscription(p_subscription_id bigint, p_actor_email text)
returns public.company_subscriptions language plpgsql security definer set search_path=public as $$
declare v_sub public.company_subscriptions%rowtype;
begin
 select * into v_sub from public.company_subscriptions where id=p_subscription_id for update;
 if not found then raise exception 'Không tìm thấy gói đăng ký.'; end if;
 if v_sub.status='active' then return v_sub; end if;
 update public.company_subscriptions set status='active', starts_at=coalesce(starts_at,now()), ends_at=coalesce(ends_at, now() + interval '1 day' * 30), confirmed_by=p_actor_email, confirmed_at=now() where id=v_sub.id returning * into v_sub;
 insert into public.platform_revenues("companyId",source,amount,"refType","refId",note) values(v_sub."companyId",'package_payment',v_sub.amount,'company_subscription',v_sub.id,'Doanh thu mua gói đăng tuyển');
 insert into public.audit_logs("actorEmail","actorRole",action,"entityType","entityId",metadata) values(p_actor_email,'admin','confirm_subscription','company_subscription',v_sub.id::text,jsonb_build_object('amount',v_sub.amount));
 return v_sub;
end $$;

create or replace function public.approve_refund(p_refund_id bigint, p_actor_email text)
returns public.refunds language plpgsql security definer set search_path=public as $$
declare v_ref public.refunds%rowtype; v_wallet public.company_wallets%rowtype; v_after numeric(14,0);
begin
 select * into v_ref from public.refunds where id=p_refund_id for update;
 if not found then raise exception 'Không tìm thấy yêu cầu hoàn tiền.'; end if;
 if v_ref.status in ('approved','paid') then return v_ref; end if;
 insert into public.company_wallets("companyId",balance) values(v_ref."companyId",0) on conflict("companyId") do nothing;
 select * into v_wallet from public.company_wallets where "companyId"=v_ref."companyId" for update;
 v_after := v_wallet.balance + v_ref.amount;
 update public.company_wallets set balance=v_after where "companyId"=v_ref."companyId";
 insert into public.wallet_transactions("companyId",type,amount,"balanceBefore","balanceAfter","refType","refId",note) values(v_ref."companyId",'refund',v_ref.amount,v_wallet.balance,v_after,'refund',v_ref.id,'Hoàn tiền vào ví');
 insert into public.platform_revenues("companyId",source,amount,"refType","refId",note) values(v_ref."companyId",'refund_adjustment',-v_ref.amount,'refund',v_ref.id,'Điều chỉnh giảm doanh thu do hoàn tiền');
 update public.refunds set status='approved', resolved_by=p_actor_email, resolved_at=now() where id=v_ref.id returning * into v_ref;
 return v_ref;
end $$;

insert into storage.buckets(id,name,public) values('private-cvs','private-cvs',false) on conflict(id) do update set public=false;

-- RLS: service role full access; app backend enforces user/company/admin roles.
do $$ declare r record; begin
 for r in select tablename from pg_tables where schemaname='public' and tablename in ('users','companies','jobs','applications','saved_jobs','notifications','cvs','booking_requests','subscription_plans','company_subscriptions','company_wallets','wallet_topups','wallet_transactions','application_accesses','commission_settings','platform_revenues','refunds','disputes','audit_logs','data_access_logs') loop
  execute format('alter table public.%I enable row level security', r.tablename);
  execute format('drop policy if exists service_role_all on public.%I', r.tablename);
  execute format('create policy service_role_all on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', r.tablename);
 end loop;
end $$;

drop policy if exists service_role_private_cvs on storage.objects;
create policy service_role_private_cvs on storage.objects for all using (bucket_id='private-cvs' and auth.role()='service_role') with check (bucket_id='private-cvs' and auth.role()='service_role');
