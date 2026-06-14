-- Link subscriptions back to booking requests without duplicate confirmations
alter table public.company_subscriptions add column if not exists "refType" text;
alter table public.company_subscriptions add column if not exists "refId" bigint;
create unique index if not exists idx_company_subscriptions_ref_unique on public.company_subscriptions("refType", "refId") where "refType" is not null and "refId" is not null;
notify pgrst, 'reload schema';
