do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='users' and column_name='id' and data_type='uuid') then
    alter table public.users alter column id set default gen_random_uuid();
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='users' and column_name='id') then
    begin alter table public.users alter column id set default (gen_random_uuid())::text; exception when others then null; end;
  end if;
end $$;
notify pgrst, 'reload schema';
