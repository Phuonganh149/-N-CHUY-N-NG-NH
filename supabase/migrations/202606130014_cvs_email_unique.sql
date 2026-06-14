do $$ begin
  if not exists (select 1 from pg_constraint where conname='cvs_email_unique') then
    begin alter table public.cvs add constraint cvs_email_unique unique(email); exception when others then null; end;
  end if;
end $$;
notify pgrst, 'reload schema';
