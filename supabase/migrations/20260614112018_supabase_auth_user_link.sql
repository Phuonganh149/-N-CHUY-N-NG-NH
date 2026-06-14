alter table if exists public.users add column if not exists auth_user_id uuid;
do $$ begin
  alter table public.users add constraint users_auth_user_id_fkey foreign key (auth_user_id) references auth.users(id) on delete set null;
exception when duplicate_object then null;
end $$;
create unique index if not exists users_auth_user_id_uidx on public.users(auth_user_id) where auth_user_id is not null;
create index if not exists users_email_idx on public.users(lower(email));
