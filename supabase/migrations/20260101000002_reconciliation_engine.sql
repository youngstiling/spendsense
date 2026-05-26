-- ProcureLayer reconciliation engine / verification certificate layer

alter table csv_import_jobs
  add column if not exists verification_status text not null default 'pending_verification'
    check (verification_status in ('pending_verification', 'verified', 'warning', 'failed')),
  add column if not exists confidence_score int,
  add column if not exists verified_at timestamptz,
  add column if not exists source_total numeric(14, 2),
  add column if not exists imported_total numeric(14, 2),
  add column if not exists reconciliation_variance numeric(14, 2);

create table if not exists import_verification_certificates (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references csv_import_jobs(id) on delete cascade,
  organisation_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  uploaded_at timestamptz not null,
  verified_at timestamptz not null,
  source_row_count int not null,
  imported_row_count int not null,
  source_total numeric(14, 2) not null,
  imported_total numeric(14, 2) not null,
  variance numeric(14, 2) not null,
  confidence_score int not null,
  status text not null check (status in ('pending_verification', 'verified', 'warning', 'failed')),
  processing_duration_ms int not null,
  created_at timestamptz not null default now(),
  unique (import_id)
);

create index if not exists import_verification_certificates_import_id_idx
  on import_verification_certificates(import_id);

create table if not exists csv_import_exceptions (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references csv_import_jobs(id) on delete cascade,
  row_number int not null,
  error_type text not null check (
    error_type in (
      'RejectedRow',
      'MissingAmount',
      'InvalidDate',
      'InvalidSupplier',
      'DuplicateTransaction',
      'BlankTransaction',
      'NegativeValue',
      'FormatError'
    )
  ),
  column_name text,
  original_value text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists csv_import_exceptions_import_id_idx
  on csv_import_exceptions(import_id);

alter table import_verification_certificates enable row level security;
alter table csv_import_exceptions enable row level security;

create policy "Users read own verification certificates"
  on import_verification_certificates for select
  using (uploaded_by = auth.uid() or organisation_id = auth.uid());

create policy "Users insert own verification certificates"
  on import_verification_certificates for insert
  with check (uploaded_by = auth.uid() and organisation_id = auth.uid());

create policy "Users read own reconciliation exceptions"
  on csv_import_exceptions for select
  using (
    exists (
      select 1 from csv_import_jobs j
      where j.id = import_id and j.user_id = auth.uid()
    )
  );

create policy "Users insert own reconciliation exceptions"
  on csv_import_exceptions for insert
  with check (
    exists (
      select 1 from csv_import_jobs j
      where j.id = import_id and j.user_id = auth.uid()
    )
  );
