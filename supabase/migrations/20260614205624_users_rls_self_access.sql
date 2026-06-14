-- Self-service RLS policies for public.users and public.user_consents
-- Service role full access already exists from 202606130001_cvms_platform.sql

alter table public.users enable row level security;
alter table public.user_consents enable row level security;

drop policy if exists users_self_select on public.users;
drop policy if exists users_self_update on public.users;
drop policy if exists user_consents_self_select on public.user_consents;
drop policy if exists user_consents_self_insert on public.user_consents;

create policy users_self_select on public.users
for select
using (auth.uid() = auth_user_id);

create policy users_self_update on public.users
for update
using (auth.uid() = auth_user_id)
with check (
  auth.uid() = auth_user_id
  -- Prevent self-promotion to admin or changing role outside [user, company]
  and role in ('user', 'company')
);

create policy user_consents_self_select on public.user_consents
for select
using (
  user_email = (select email from public.users where auth_user_id = auth.uid())
);

create policy user_consents_self_insert on public.user_consents
for insert
with check (
  user_email = (select email from public.users where auth_user_id = auth.uid())
);

notify pgrst, 'reload schema';