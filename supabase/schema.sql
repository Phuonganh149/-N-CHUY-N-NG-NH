create table if not exists public.users (
  email text primary key,
  name text not null,
  password text not null,
  role text not null default 'user',
  "companyId" bigint,
  "companyRole" text,
  phone text,
  address text,
  bio text,
  "targetPosition" text,
  "experienceLevel" text,
  education text,
  skills text,
  "expectedSalary" text,
  "desiredLocations" text,
  "workType" text,
  portfolio text,
  linkedin text
);

create table if not exists public.companies (
  id bigint primary key,
  name text not null,
  slug text,
  industry text,
  location text,
  plan text,
  status text default 'active',
  "createdAt" text
);

create table if not exists public.jobs (
  id bigint primary key,
  title text not null,
  company text not null,
  "companyId" bigint,
  location text not null,
  salary text,
  "salaryNum" integer default 0,
  deadline text,
  tags jsonb not null default '[]'::jsonb,
  dept text,
  qty integer default 1,
  applicants integer default 0,
  status text default 'Đang tuyển',
  active boolean default true
);

create table if not exists public.applications (
  id bigint primary key,
  "jobId" bigint not null,
  "companyId" bigint,
  "jobTitle" text not null,
  company text not null,
  location text not null,
  "userEmail" text not null,
  "userName" text not null,
  status text not null default 'Mới nộp',
  "pipelineStage" text not null default 'new',
  date text,
  "dateTs" bigint,
  "adminNote" text default '',
  "aiScore" integer,
  "aiFitLevel" text,
  "aiEvaluation" jsonb,
  "aiEvaluatedAt" text,
  "sharedToCompany" boolean default false,
  "sharedAt" text,
  "companyShareNote" text,
  "companyFeedback" text,
  "companyFeedbackAt" text
);

alter table public.applications
  add column if not exists "sharedToCompany" boolean default false;

alter table public.applications
  add column if not exists "sharedAt" text;

alter table public.applications
  add column if not exists "companyShareNote" text;

alter table public.applications
  add column if not exists "companyFeedback" text;

alter table public.applications
  add column if not exists "companyFeedbackAt" text;

create table if not exists public.saved_jobs (
  "userEmail" text not null,
  "jobId" bigint not null,
  "savedAt" text,
  primary key ("userEmail", "jobId")
);

create table if not exists public.notifications (
  id bigint primary key,
  role text not null,
  "targetEmail" text,
  type text,
  title text not null,
  body text not null,
  "appId" bigint,
  "jobId" bigint,
  "companyId" bigint,
  "jobTitle" text,
  "userEmail" text,
  time text,
  read boolean default false
);

create table if not exists public.booking_requests (
  id bigint primary key,
  role text not null default 'company',
  "companyName" text not null,
  "contactName" text not null,
  email text not null,
  phone text,
  industry text,
  "packageKey" text,
  "packageLabel" text,
  "jobTitle" text,
  quantity integer default 1,
  duration integer default 30,
  "totalAmount" bigint default 0,
  note text,
  status text default 'pending',
  "paymentStatus" text default 'waiting_transfer',
  "paymentConfirmedAt" text,
  "adminConfirmedAt" text,
  "rejectedReason" text,
  "companyId" bigint,
  "jobId" bigint,
  "createdAt" text,
  source text default 'public'
);

alter table public.booking_requests
  add column if not exists "paymentStatus" text default 'waiting_transfer';

alter table public.booking_requests
  add column if not exists "paymentConfirmedAt" text;

alter table public.booking_requests
  add column if not exists "adminConfirmedAt" text;

alter table public.booking_requests
  add column if not exists "rejectedReason" text;

alter table public.booking_requests
  add column if not exists "companyId" bigint;

alter table public.booking_requests
  add column if not exists "jobId" bigint;

create table if not exists public.cvs (
  email text primary key,
  name text not null,
  type text,
  ext text,
  size bigint,
  base64 text not null,
  "uploadedAt" text,
  industries jsonb not null default '[]'::jsonb
);

create index if not exists idx_applications_job on public.applications ("jobId");
create index if not exists idx_applications_user on public.applications ("userEmail");
create index if not exists idx_jobs_company on public.jobs ("companyId");
create index if not exists idx_applications_company on public.applications ("companyId");
create index if not exists idx_saved_jobs_user on public.saved_jobs ("userEmail");
create index if not exists idx_notifications_role on public.notifications (role);
create index if not exists idx_notifications_target on public.notifications ("targetEmail");
create index if not exists idx_booking_requests_email on public.booking_requests (email);
