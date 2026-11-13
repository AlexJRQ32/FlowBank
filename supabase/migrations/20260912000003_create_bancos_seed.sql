-- Seed table, no user_id. Readable by all authenticated users (see RLS migration).
-- Legacy: Nombre nvarchar(150) required + unique index.
create table public.bancos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  logo_url text,
  es_activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Costa Rican banks (exact normalized names; source repo had no seed data).
insert into public.bancos (nombre) values
  ('Banco Nacional de Costa Rica'),
  ('Banco de Costa Rica'),
  ('Banco Crédito Agrícola de Cartago'),
  ('BAC Credomatic'),
  ('Banco Promerica'),
  ('Banco Davivienda Costa Rica'),
  ('Banco BCT'),
  ('Banco Cathay'),
  ('Banco G&T Continental');
