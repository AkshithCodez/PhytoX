-- Run with Supabase migrations. All operational tables are private by default.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.regions (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 latitude double precision check(latitude between -90 and 90),
 longitude double precision check(longitude between -180 and 180)
);
create table public.user_profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null default '' check(length(display_name)<=100),
 role text not null default 'farmer' check(role in ('farmer','officer','admin')),
 language text not null default 'en' check(language in ('en','te','hi')),
 region_id uuid references public.regions, created_at timestamptz not null default now()
);
create table public.officer_regions (
 officer_id uuid references public.user_profiles on delete cascade,
 region_id uuid references public.regions on delete cascade, primary key(officer_id,region_id)
);
create table public.diagnoses (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.user_profiles,
 request_key uuid not null, status text not null default 'processing' check(status in ('processing','complete','failed')),
 image_path text, result jsonb, error_code text, created_at timestamptz not null default now(),
 unique(owner_id,request_key), check(status <> 'complete' or (result is not null and image_path is not null))
);
create table public.diagnosis_predictions (
 diagnosis_id uuid references public.diagnoses on delete cascade, rank smallint check(rank between 1 and 5),
 crop text not null, disease text not null, confidence double precision not null check(confidence between 0 and 1),
 primary key(diagnosis_id,rank)
);
create table public.farmer_reports (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.user_profiles,
 diagnosis_id uuid not null references public.diagnoses, region_id uuid not null references public.regions,
 crop text not null, disease text not null, notes text not null default '' check(length(notes)<=2000),
 consent_at timestamptz not null, latitude double precision check(latitude between -90 and 90),
 longitude double precision check(longitude between -180 and 180),
 status text not null default 'pending' check(status in ('pending','verified','rejected','follow_up')),
 version integer not null default 1, created_at timestamptz not null default now(),
 unique(diagnosis_id), check((latitude is null)=(longitude is null))
);
create table public.officer_reviews (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.farmer_reports,
 officer_id uuid not null references public.user_profiles, status text not null check(status in ('verified','rejected','follow_up')),
 notes text not null check(length(notes) between 3 and 2000), created_at timestamptz not null default now()
);
create table public.monitoring_alerts (
 id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions,
 crop text not null, disease text not null, status text not null default 'investigating' check(status in ('investigating','confirmed','dismissed')),
 notes text not null check(length(notes) between 3 and 2000), created_by uuid not null references public.user_profiles,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_investigation on public.monitoring_alerts(region_id,crop,disease) where status='investigating';
create table public.alert_evidence (
 alert_id uuid references public.monitoring_alerts, report_id uuid references public.farmer_reports,
 primary key(alert_id,report_id)
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.user_profiles,
 action text not null, record_id uuid not null, region_id uuid references public.regions,
 details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index diagnoses_owner_date on public.diagnoses(owner_id,created_at desc);
create index reports_region_date on public.farmer_reports(region_id,created_at desc);
create index reports_owner on public.farmer_reports(owner_id);
create index reviews_report on public.officer_reviews(report_id,created_at);

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.user_profiles where id=auth.uid() and role='admin'); $$;
create function private.can_review(r uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or exists(select 1 from public.officer_regions o join public.user_profiles p on p.id=o.officer_id where o.officer_id=auth.uid() and o.region_id=r and p.role='officer'); $$;
create function private.can_read_diagnosis(d uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.diagnoses where id=d and owner_id=auth.uid()) or exists(select 1 from public.farmer_reports where diagnosis_id=d and private.can_review(region_id)); $$;
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.user_profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100)); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_user();

alter table public.regions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.officer_regions enable row level security;
alter table public.diagnoses enable row level security;
alter table public.diagnosis_predictions enable row level security;
alter table public.farmer_reports enable row level security;
alter table public.officer_reviews enable row level security;
alter table public.monitoring_alerts enable row level security;
alter table public.alert_evidence enable row level security;
alter table public.audit_logs enable row level security;
create policy regions_read on public.regions for select to authenticated using(true);
create policy profile_read on public.user_profiles for select to authenticated using(id=auth.uid() or private.is_admin());
create policy profile_update on public.user_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy assignments_read on public.officer_regions for select to authenticated using(officer_id=auth.uid() or private.is_admin());
create policy diagnosis_read on public.diagnoses for select to authenticated using(private.can_read_diagnosis(id));
create policy predictions_read on public.diagnosis_predictions for select to authenticated using(private.can_read_diagnosis(diagnosis_id));
create policy reports_read on public.farmer_reports for select to authenticated using(owner_id=auth.uid() or private.can_review(region_id));
create policy reviews_read on public.officer_reviews for select to authenticated using(exists(select 1 from public.farmer_reports r where r.id=report_id and (r.owner_id=auth.uid() or private.can_review(r.region_id))));
create policy alerts_read on public.monitoring_alerts for select to authenticated using(private.can_review(region_id));
create policy evidence_read on public.alert_evidence for select to authenticated using(exists(select 1 from public.monitoring_alerts a where a.id=alert_id and private.can_review(a.region_id)));
create policy audit_read on public.audit_logs for select to authenticated using(private.is_admin() or private.can_review(region_id));
revoke all on all tables in schema public from anon,authenticated;
grant select on public.regions,public.user_profiles,public.officer_regions,public.diagnoses,public.diagnosis_predictions,public.farmer_reports,public.officer_reviews,public.monitoring_alerts,public.alert_evidence,public.audit_logs to authenticated;
grant update(display_name,language,region_id) on public.user_profiles to authenticated;

create function public.reserve_diagnosis(p_key uuid) returns public.diagnoses language plpgsql security definer set search_path='' as $$
 declare d public.diagnoses;
 begin
 if auth.uid() is null then raise exception 'Unauthorized' using errcode='42501'; end if;
 perform 1 from public.user_profiles where id=auth.uid() for update;
 select * into d from public.diagnoses where owner_id=auth.uid() and request_key=p_key;
 if found then return d; end if;
 if (select count(*) from public.diagnoses where owner_id=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'Hourly analysis limit reached'; end if;
 insert into public.diagnoses(owner_id,request_key) values(auth.uid(),p_key) returning * into d; return d;
 end; $$;

create function public.finish_diagnosis(p_id uuid,p_owner uuid,p_result jsonb,p_error text default null) returns void language plpgsql security definer set search_path='' as $$
 declare d public.diagnoses; item jsonb; n integer:=1;
 begin
 if auth.role() is distinct from 'service_role' then raise exception 'Trusted service required' using errcode='42501'; end if;
 select * into d from public.diagnoses where id=p_id and owner_id=p_owner for update;
 if not found then raise exception 'Forbidden' using errcode='42501'; end if;
 if d.status<>'processing' then raise exception 'Already finalized' using errcode='40001'; end if;
 if p_error is not null then update public.diagnoses set status='failed',error_code=left(p_error,100) where id=p_id; return; end if;
 if p_result->>'schema_version'<>'1.0' or p_result->>'status'<>'success' or p_result->'prediction' is null or jsonb_typeof(p_result->'alternatives')<>'array' then raise exception 'Invalid prediction'; end if;
 -- Only the trusted inference orchestrator can persist a model response.
 if not exists(select 1 from storage.objects where bucket_id='crop-images' and name=p_owner::text||'/'||p_id::text||'/image') then raise exception 'Image missing'; end if;
 update public.diagnoses set status='complete',image_path=p_owner::text||'/'||p_id::text||'/image',result=p_result where id=p_id;
 for item in select value from jsonb_array_elements(jsonb_build_array(p_result->'prediction')||(p_result->'alternatives')) loop
 insert into public.diagnosis_predictions values(p_id,n,item->>'crop',item->>'disease',(item->>'confidence')::double precision); n:=n+1;
 end loop;
 end; $$;

create function public.submit_report(p_diagnosis uuid,p_region uuid,p_notes text,p_consent boolean,p_lat double precision default null,p_lng double precision default null) returns uuid language plpgsql security definer set search_path='' as $$
 declare d public.diagnoses; rid uuid;
 begin
 if p_consent is distinct from true then raise exception 'Consent required'; end if;
 select * into d from public.diagnoses where id=p_diagnosis and owner_id=auth.uid() and status='complete';
 if not found then raise exception 'Diagnosis unavailable' using errcode='42501'; end if;
 insert into public.farmer_reports(owner_id,diagnosis_id,region_id,crop,disease,notes,consent_at,latitude,longitude)
 values(auth.uid(),d.id,p_region,d.result->'prediction'->>'crop',d.result->'prediction'->>'disease',p_notes,now(),p_lat,p_lng)
 on conflict(diagnosis_id) do nothing returning id into rid;
 if rid is null then select id into rid from public.farmer_reports where diagnosis_id=p_diagnosis and owner_id=auth.uid(); end if;
 return rid;
 end; $$;

create function public.review_report(p_id uuid,p_version integer,p_status text,p_notes text) returns void language plpgsql security definer set search_path='' as $$
 declare r public.farmer_reports;
 begin
 select * into r from public.farmer_reports where id=p_id for update;
 if not found or not private.can_review(r.region_id) then raise exception 'Forbidden' using errcode='42501'; end if;
 if r.version<>p_version then raise exception 'Report changed; reload before reviewing' using errcode='40001'; end if;
 insert into public.officer_reviews(report_id,officer_id,status,notes) values(r.id,auth.uid(),p_status,p_notes);
 update public.farmer_reports set status=p_status,version=version+1 where id=r.id;
 insert into public.audit_logs(actor_id,action,record_id,region_id,details) values(auth.uid(),'report.review',r.id,r.region_id,jsonb_build_object('from',r.status,'to',p_status,'notes',p_notes));
 end; $$;

create function public.regional_insights(p_region uuid) returns table(crop text,disease text,observations bigint) language sql stable security definer set search_path='' as $$
 select r.crop,r.disease,count(*) from public.farmer_reports r where auth.uid() is not null and r.region_id=p_region and r.status='verified' and r.created_at>=now()-interval '30 days' group by r.crop,r.disease having count(distinct r.owner_id)>=3;
 $$;
create function public.regional_alerts(p_region uuid) returns table(id uuid,crop text,disease text,created_at timestamptz) language sql stable security definer set search_path='' as $$
 select a.id,a.crop,a.disease,a.created_at from public.monitoring_alerts a where auth.uid() is not null and a.region_id=p_region and a.status='confirmed'; $$;

create function public.open_alert(p_region uuid,p_crop text,p_disease text,p_notes text) returns uuid language plpgsql security definer set search_path='' as $$
 declare aid uuid;
 begin
 if not private.can_review(p_region) then raise exception 'Forbidden' using errcode='42501'; end if;
 if (select count(*) from public.farmer_reports where region_id=p_region and crop=p_crop and disease=p_disease and status<>'rejected' and created_at>=now()-interval '7 days')<5
 or (select count(distinct owner_id) from public.farmer_reports where region_id=p_region and crop=p_crop and disease=p_disease and status<>'rejected' and created_at>=now()-interval '7 days')<3
 or (select count(*) from public.farmer_reports where region_id=p_region and crop=p_crop and disease=p_disease and status='verified' and created_at>=now()-interval '7 days')<2 then raise exception 'Insufficient evidence'; end if;
 insert into public.monitoring_alerts(region_id,crop,disease,notes,created_by) values(p_region,p_crop,p_disease,p_notes,auth.uid()) returning id into aid;
 insert into public.alert_evidence select aid,id from public.farmer_reports where region_id=p_region and crop=p_crop and disease=p_disease and status<>'rejected' and created_at>=now()-interval '7 days';
 insert into public.audit_logs(actor_id,action,record_id,region_id) values(auth.uid(),'alert.open',aid,p_region);
 return aid;
 end; $$;
create function public.resolve_alert(p_id uuid,p_status text,p_notes text) returns void language plpgsql security definer set search_path='' as $$
 declare a public.monitoring_alerts;
 begin
 select * into a from public.monitoring_alerts where id=p_id for update;
 if not found or not private.can_review(a.region_id) then raise exception 'Forbidden' using errcode='42501'; end if;
 if a.status<>'investigating' or p_status not in ('confirmed','dismissed') then raise exception 'Invalid alert transition'; end if;
 update public.monitoring_alerts set status=p_status,notes=p_notes,updated_at=now() where id=p_id;
 insert into public.audit_logs(actor_id,action,record_id,region_id,details) values(auth.uid(),'alert.resolve',p_id,a.region_id,jsonb_build_object('status',p_status,'notes',p_notes));
 end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('crop-images','crop-images',false,8388608,array['image/jpeg','image/png','image/webp']);
create policy crop_upload on storage.objects for insert to authenticated with check(bucket_id='crop-images' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.diagnoses where owner_id=auth.uid() and id::text=(storage.foldername(name))[2] and status='processing') and storage.filename(name)='image');
create policy crop_read on storage.objects for select to authenticated using(bucket_id='crop-images' and exists(select 1 from public.diagnoses d where (d.image_path=name or (d.status='processing' and name=d.owner_id::text||'/'||d.id::text||'/image')) and private.can_read_diagnosis(d.id)));
create policy failed_crop_delete on storage.objects for delete to authenticated using(bucket_id='crop-images' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.diagnoses where owner_id=auth.uid() and id::text=(storage.foldername(name))[2] and status='failed'));

revoke execute on all functions in schema public from public,anon;
grant execute on function public.reserve_diagnosis(uuid),public.submit_report(uuid,uuid,text,boolean,double precision,double precision),public.review_report(uuid,integer,text,text),public.regional_insights(uuid),public.regional_alerts(uuid),public.open_alert(uuid,text,text,text),public.resolve_alert(uuid,text,text) to authenticated;
revoke execute on function public.finish_diagnosis(uuid,uuid,jsonb,text) from authenticated;
grant execute on function public.finish_diagnosis(uuid,uuid,jsonb,text) to service_role;
revoke execute on all functions in schema private from public,anon;
grant execute on function private.is_admin(),private.can_review(uuid),private.can_read_diagnosis(uuid) to authenticated;
