-- Fix Supabase Auth signup 500 "Database error saving new user" caused by legacy/custom triggers on auth.users.
-- CVMS now creates/links public.users profile from backend after Supabase Auth succeeds,
-- so custom auth.users triggers are not needed.
do $$
declare
  r record;
begin
  for r in
    select tgname
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and not tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;
