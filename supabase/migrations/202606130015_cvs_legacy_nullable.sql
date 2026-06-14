alter table public.cvs alter column user_id drop not null;
notify pgrst, 'reload schema';
