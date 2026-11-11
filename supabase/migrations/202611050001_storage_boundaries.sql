-- Restrict each reservation to its one canonical object; preserve original migration.
drop policy crop_upload on storage.objects;
create policy crop_upload on storage.objects for insert to authenticated with check (
  bucket_id='crop-images' and exists (
    select 1 from public.diagnoses d where d.owner_id=auth.uid()
    and d.status='processing' and name=d.owner_id::text||'/'||d.id::text||'/image'
  )
);
-- DELETE with row filtering also requires SELECT visibility. Failed images remain owner-only.
create policy failed_crop_owner_read on storage.objects for select to authenticated using (
  bucket_id='crop-images' and exists (
    select 1 from public.diagnoses d where d.owner_id=auth.uid()
    and d.status='failed' and name=d.owner_id::text||'/'||d.id::text||'/image'
  )
);
drop policy failed_crop_delete on storage.objects;
create policy failed_crop_delete on storage.objects for delete to authenticated using (
  bucket_id='crop-images' and exists (
    select 1 from public.diagnoses d where d.owner_id=auth.uid()
    and d.status='failed' and name=d.owner_id::text||'/'||d.id::text||'/image'
  )
);
