-- RLS per plan §2.2.
-- Notes:
-- - TO authenticated everywhere (never auth.role() — deprecated per plan §1 rule 8).
-- - bancos / tipo_cambio_cache: SELECT only; writes denied for anon + authenticated
--   (service_role bypasses RLS, used by seed / server action).
-- - profiles: SELECT/UPDATE only — INSERT is handled by the handle_new_user trigger.
-- - facturas / registros_pago: no user_id; ownership via tarjeta_id → tarjetas.user_id.

alter table public.profiles enable row level security;
alter table public.bancos enable row level security;
alter table public.tarjetas enable row level security;
alter table public.facturas enable row level security;
alter table public.registros_pago enable row level security;
alter table public.tipo_cambio_cache enable row level security;

-- profiles: self-scoped
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- bancos: read-only for authenticated
create policy "bancos_select_authenticated" on public.bancos
  for select to authenticated
  using (true);

-- tarjetas: user-scoped
create policy "tarjetas_select_own" on public.tarjetas
  for select to authenticated
  using (auth.uid() = user_id);

create policy "tarjetas_insert_own" on public.tarjetas
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "tarjetas_update_own" on public.tarjetas
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tarjetas_delete_own" on public.tarjetas
  for delete to authenticated
  using (auth.uid() = user_id);

-- facturas: scoped through tarjeta ownership
create policy "facturas_select_own" on public.facturas
  for select to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "facturas_insert_own" on public.facturas
  for insert to authenticated
  with check (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "facturas_update_own" on public.facturas
  for update to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  )
  with check (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "facturas_delete_own" on public.facturas
  for delete to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

-- registros_pago: scoped through tarjeta ownership
create policy "registros_pago_select_own" on public.registros_pago
  for select to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "registros_pago_insert_own" on public.registros_pago
  for insert to authenticated
  with check (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "registros_pago_update_own" on public.registros_pago
  for update to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  )
  with check (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

create policy "registros_pago_delete_own" on public.registros_pago
  for delete to authenticated
  using (
    tarjeta_id in (select id from public.tarjetas where user_id = auth.uid())
  );

-- tipo_cambio_cache: read-only for authenticated
create policy "tipo_cambio_cache_select_authenticated" on public.tipo_cambio_cache
  for select to authenticated
  using (true);
