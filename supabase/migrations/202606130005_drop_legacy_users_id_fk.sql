alter table public.users drop constraint if exists users_id_fkey;
notify pgrst, 'reload schema';
