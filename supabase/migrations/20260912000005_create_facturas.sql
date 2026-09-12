-- All fields from legacy Factura entity.
-- Deliberate changes (plan §2.1): user_id REMOVED (ownership via tarjeta_id join);
-- tarjeta_id NOT NULL + ON DELETE CASCADE (legacy was nullable + SetNull).
-- No OCR fields exist in legacy — none created.
create table public.facturas (
  id uuid primary key default gen_random_uuid(),
  tarjeta_id uuid not null references public.tarjetas (id) on delete cascade,
  monto_total numeric(18, 2) not null,
  moneda text not null default 'CRC' check (moneda in ('CRC', 'USD')),
  fecha_compra date,
  comercio text,
  imagen_url text,
  created_at timestamptz not null default now()
);
