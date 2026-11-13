-- All fields from legacy Tarjeta entity + FlowBankDbContext config.
-- Deliberate change (plan §2.1): user_id NOT NULL + ON DELETE CASCADE
-- (legacy had nullable UsuarioId with SetNull; plan ruling wins).
-- Legacy had no moneda/color on Tarjeta — not invented here.
create table public.tarjetas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  banco_id uuid not null references public.bancos (id) on delete restrict,
  nombre text not null,
  ultimos_cuatro_digitos varchar(4) not null,
  tipo text not null,
  dia_corte int not null check (dia_corte between 1 and 31),
  dia_pago int not null check (dia_pago between 1 and 31),
  limite_credito numeric(18, 2) not null default 0,
  saldo_actual numeric(18, 2) not null default 0,
  nota text,
  es_activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_tarjetas_updated_at
  before update on public.tarjetas
  for each row
  execute function public.set_updated_at();
