do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='jobs' and column_name='deadline' and data_type <> 'text') then
    alter table public.jobs alter column deadline type text using deadline::text;
  end if;
end $$;
notify pgrst, 'reload schema';
