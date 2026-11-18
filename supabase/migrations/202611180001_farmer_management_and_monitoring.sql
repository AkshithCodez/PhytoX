-- Migration: 202611180001_farmer_management_and_monitoring.sql
-- Adds officer-administered farmer management & continuous longitudinal crop monitoring

-- 1. Extend user_profiles with farmer lifecycle and jurisdiction metadata
alter table public.user_profiles
  add column if not exists status text not null default 'active' check(status in ('invited','pending_activation','active','suspended','deactivated')),
  add column if not exists invited_by uuid references public.user_profiles,
  add column if not exists phone text default '',
  add column if not exists village text default '',
  add column if not exists farm_size text default '';

-- 2. Expand user_profiles select policy so authorized officers can view farmers in their assigned regions
drop policy if exists profile_read on public.user_profiles;
create policy profile_read on public.user_profiles for select to authenticated using (
  id = auth.uid()
  or private.is_admin()
  or (
    role = 'farmer'
    and region_id in (
      select region_id from public.officer_regions where officer_id = auth.uid()
    )
  )
);

-- 3. Policy allowing officers to update farmer status (e.g. suspend / reactivate) within their jurisdiction
drop policy if exists officer_manage_farmer on public.user_profiles;
create policy officer_manage_farmer on public.user_profiles for update to authenticated using (
  role = 'farmer'
  and region_id in (
    select region_id from public.officer_regions where officer_id = auth.uid()
  )
) with check (
  role = 'farmer'
  and region_id in (
    select region_id from public.officer_regions where officer_id = auth.uid()
  )
);

-- 4. Monitored Plots for Continuous Crop Surveillance
create table if not exists public.monitored_plots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.user_profiles on delete cascade,
  name text not null check(length(name) between 1 and 100),
  crop text not null check(length(crop) between 1 and 50),
  region_id uuid not null references public.regions,
  planting_date date,
  plot_area text default '',
  status text not null default 'active' check(status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Observation Schedules (Twice-weekly cadence e.g. Mon & Thu)
create table if not exists public.monitoring_schedules (
  plot_id uuid primary key references public.monitored_plots on delete cascade,
  cadence text not null default 'twice_weekly' check(cadence in ('twice_weekly','weekly','custom')),
  observation_days text[] not null default array['monday','thursday'],
  next_due_date date not null default (current_date + interval '3 days')::date,
  updated_at timestamptz not null default now()
);

-- 6. Crop Observations (Longitudinal observation records)
create table if not exists public.crop_observations (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.monitored_plots on delete cascade,
  owner_id uuid not null references public.user_profiles on delete cascade,
  observation_date date not null default current_date,
  image_path text not null,
  symptoms text[] not null default array[]::text[],
  notes text not null default '' check(length(notes) <= 2000),
  ai_assessment jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check(status in ('submitted','reviewed','flagged')),
  created_at timestamptz not null default now()
);

-- 7. Monitoring Early-Warning Signals
create table if not exists public.monitoring_signals (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.monitored_plots on delete cascade,
  region_id uuid not null references public.regions,
  signal_type text not null check(signal_type in ('recurrent_disease','confidence_shift','symptom_progression','regional_cluster')),
  severity text not null default 'medium' check(severity in ('low','medium','high')),
  suspected_condition text not null,
  notes text not null check(length(notes) between 3 and 2000),
  status text not null default 'open' check(status in ('open','reviewed','dismissed','advisory_issued')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.user_profiles,
  reviewed_at timestamptz
);

-- 8. Officer Field Advisories (Targeted guidance communicated back to farmer)
create table if not exists public.monitoring_advisories (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references public.monitoring_signals on delete set null,
  plot_id uuid not null references public.monitored_plots on delete cascade,
  officer_id uuid not null references public.user_profiles,
  farmer_id uuid not null references public.user_profiles,
  advisory_text text not null check(length(advisory_text) between 5 and 3000),
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists plots_owner on public.monitored_plots(owner_id);
create index if not exists plots_region on public.monitored_plots(region_id);
create index if not exists observations_plot_date on public.crop_observations(plot_id, observation_date desc);
create index if not exists signals_region_status on public.monitoring_signals(region_id, status);
create index if not exists signals_plot on public.monitoring_signals(plot_id);
create index if not exists advisories_farmer on public.monitoring_advisories(farmer_id);

-- Enable RLS on all new tables
alter table public.monitored_plots enable row level security;
alter table public.monitoring_schedules enable row level security;
alter table public.crop_observations enable row level security;
alter table public.monitoring_signals enable row level security;
alter table public.monitoring_advisories enable row level security;

-- Grants
grant select, insert, update on public.monitored_plots to authenticated;
grant select, insert, update on public.monitoring_schedules to authenticated;
grant select, insert on public.crop_observations to authenticated;
grant select, update on public.monitoring_signals to authenticated;
grant select, insert on public.monitoring_advisories to authenticated;

-- Policies for monitored_plots
drop policy if exists plots_read on public.monitored_plots;
create policy plots_read on public.monitored_plots for select to authenticated using (
  owner_id = auth.uid()
  or private.can_review(region_id)
);

drop policy if exists plots_insert on public.monitored_plots;
create policy plots_insert on public.monitored_plots for insert to authenticated with check (
  owner_id = auth.uid()
);

drop policy if exists plots_update on public.monitored_plots;
create policy plots_update on public.monitored_plots for update to authenticated using (
  owner_id = auth.uid() or private.can_review(region_id)
);

-- Policies for monitoring_schedules
drop policy if exists schedules_read on public.monitoring_schedules;
create policy schedules_read on public.monitoring_schedules for select to authenticated using (
  exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and (p.owner_id = auth.uid() or private.can_review(p.region_id))
  )
);

drop policy if exists schedules_insert on public.monitoring_schedules;
create policy schedules_insert on public.monitoring_schedules for insert to authenticated with check (
  exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and p.owner_id = auth.uid()
  )
);

drop policy if exists schedules_update on public.monitoring_schedules;
create policy schedules_update on public.monitoring_schedules for update to authenticated using (
  exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and (p.owner_id = auth.uid() or private.can_review(p.region_id))
  )
);

-- Policies for crop_observations
drop policy if exists observations_read on public.crop_observations;
create policy observations_read on public.crop_observations for select to authenticated using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and private.can_review(p.region_id)
  )
);

drop policy if exists observations_insert on public.crop_observations;
create policy observations_insert on public.crop_observations for insert to authenticated with check (
  owner_id = auth.uid()
);

-- Policies for monitoring_signals
drop policy if exists signals_read on public.monitoring_signals;
create policy signals_read on public.monitoring_signals for select to authenticated using (
  private.can_review(region_id)
  or exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and p.owner_id = auth.uid()
  )
);

drop policy if exists signals_update on public.monitoring_signals;
create policy signals_update on public.monitoring_signals for update to authenticated using (
  private.can_review(region_id)
);

-- Policies for monitoring_advisories
drop policy if exists advisories_read on public.monitoring_advisories;
create policy advisories_read on public.monitoring_advisories for select to authenticated using (
  farmer_id = auth.uid()
  or officer_id = auth.uid()
  or exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and private.can_review(p.region_id)
  )
);

drop policy if exists advisories_insert on public.monitoring_advisories;
create policy advisories_insert on public.monitoring_advisories for insert to authenticated with check (
  exists (
    select 1 from public.monitored_plots p
    where p.id = plot_id and private.can_review(p.region_id)
  )
);
