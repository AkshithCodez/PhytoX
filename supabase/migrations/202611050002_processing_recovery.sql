-- Server-only maintenance. Keep the 15-minute grace well above the 60s inference timeout.
create index diagnoses_processing_age on public.diagnoses(created_at) where status='processing';

create function public.reconcile_stale_diagnoses(p_limit integer default 100)
returns table(image_path text) language plpgsql security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Trusted service required' using errcode='42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'Invalid batch size' using errcode='22023';
  end if;
  -- Serialize against finish_diagnosis; an already completed result cannot be expired.
  with expired as (
    select id from public.diagnoses
    where status='processing' and created_at < now()-interval '15 minutes'
    order by created_at limit p_limit for update skip locked
  )
  update public.diagnoses d set status='failed',error_code='processing_expired'
  from expired e where d.id=e.id;

  -- Retry failed deletions on every invocation. Storage API, not SQL, removes bytes.
  return query select o.name from public.diagnoses d join storage.objects o
    on o.bucket_id='crop-images' and o.name=d.owner_id::text||'/'||d.id::text||'/image'
    where d.status='failed' order by d.created_at limit p_limit;
end; $$;
revoke all on function public.reconcile_stale_diagnoses(integer) from public,anon,authenticated;
grant execute on function public.reconcile_stale_diagnoses(integer) to service_role;
