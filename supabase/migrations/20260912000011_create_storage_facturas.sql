-- Storage bucket 'facturas' + policies (plan Phase 5, OCR upload).
-- Private bucket (public = false): access only for authenticated users.
-- Upload path convention (src/app/(app)/facturas/actions.ts):
--   `${user.id}/${uuid}.${ext}` — first folder segment == auth.uid().

insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do nothing;

-- INSERT: authenticated users upload only under their own folder.
create policy "storage_facturas_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'facturas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: any authenticated user may read/list factura objects.
create policy "storage_facturas_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'facturas');

-- DELETE: only the owner (first folder segment == auth.uid()).
create policy "storage_facturas_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'facturas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
