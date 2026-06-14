do $$ begin
  begin alter table public.applications alter column user_id drop not null; exception when others then null; end;
  begin alter table public.applications alter column job_id drop not null; exception when others then null; end;
end $$;
notify pgrst, 'reload schema';
