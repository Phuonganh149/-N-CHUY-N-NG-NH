do $$ begin
  begin alter table public.cvs alter column file_name drop not null; exception when others then null; end;
  begin alter table public.cvs alter column file_path drop not null; exception when others then null; end;
  begin alter table public.cvs alter column is_active drop not null; exception when others then null; end;
end $$;
notify pgrst, 'reload schema';
