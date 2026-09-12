-- All fields from legacy RegistroPago entity + DbContext config.
-- Legacy delete behavior was already Cascade; kept.
create table public.registros_pago (
  id uuid primary key default gen_random_uuid(),
  tarjeta_id uuid not null references public.tarjetas (id) on delete cascade,
  fecha_pago date not null,
  fecha_realizada timestamptz,
  monto numeric(18, 2) not null,
  estado text not null,
  nota text,
  created_at timestamptz not null default now()
);
