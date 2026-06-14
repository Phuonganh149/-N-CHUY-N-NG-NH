alter table public.users add column if not exists email text;
alter table public.users add column if not exists name text;
alter table public.users add column if not exists password text;
alter table public.users add column if not exists role text not null default 'user';
alter table public.users add column if not exists "companyId" bigint;
alter table public.users add column if not exists "companyRole" text;
update public.users set name = coalesce(name, email, 'Người dùng') where name is null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'users_email_key') then
    begin alter table public.users add constraint users_email_key unique (email); exception when others then null; end;
  end if;
end $$;
notify pgrst, 'reload schema';
