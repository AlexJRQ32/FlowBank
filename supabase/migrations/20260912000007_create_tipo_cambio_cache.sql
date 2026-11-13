-- Replaces the legacy in-memory TipoCambioService cache.
-- fecha is the natural PK: cache upsert is INSERT ... ON CONFLICT (fecha) DO UPDATE.
-- Populated by server action / service_role only (no write policies below).
create table public.tipo_cambio_cache (
  fecha date primary key,
  compra numeric(18, 4) not null,
  venta numeric(18, 4) not null,
  fuente text,
  fetched_at timestamptz not null default now()
);
