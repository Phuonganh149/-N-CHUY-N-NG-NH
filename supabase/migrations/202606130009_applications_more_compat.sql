alter table public.applications add column if not exists "sharedToCompany" boolean default false;
alter table public.applications add column if not exists "sharedAt" text;
alter table public.applications add column if not exists "companyShareNote" text;
alter table public.applications add column if not exists "companyFeedback" text;
alter table public.applications add column if not exists "companyFeedbackAt" text;
notify pgrst, 'reload schema';
