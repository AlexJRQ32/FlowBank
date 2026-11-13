-- LEGACY PARITY (BancoFormModal): authenticated users may add banks to the
-- catalog (legacy app called createBanco). Reads stay authenticated-only.
create policy "bancos_insert_authenticated" on public.bancos
  for insert to authenticated
  with check (true);
