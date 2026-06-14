-- compatibility profile/cv columns after hosted schema cache
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists address text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists "targetPosition" text;
alter table public.users add column if not exists "experienceLevel" text;
alter table public.users add column if not exists education text;
alter table public.users add column if not exists skills text;
alter table public.users add column if not exists "expectedSalary" text;
alter table public.users add column if not exists "desiredLocations" text;
alter table public.users add column if not exists "workType" text;
alter table public.users add column if not exists portfolio text;
alter table public.users add column if not exists linkedin text;
notify pgrst, 'reload schema';
