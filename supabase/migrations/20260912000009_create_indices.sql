-- Indices per plan §2.3. Legacy unique indexes replicated where they map:
-- bancos.nombre (unique), tarjetas.user_id/banco_id, facturas.tarjeta_id.
-- Legacy had NO unique constraint on (tarjeta_id, fecha_compra) — not invented.
-- facturas(fecha_compra desc) supports the dashboard list ordering.

create index idx_tarjetas_user_id on public.tarjetas (user_id);
create index idx_tarjetas_banco_id on public.tarjetas (banco_id);
create index idx_facturas_tarjeta_id on public.facturas (tarjeta_id);
create index idx_facturas_fecha_compra_desc on public.facturas (fecha_compra desc);
create index idx_registros_pago_tarjeta_id on public.registros_pago (tarjeta_id);
