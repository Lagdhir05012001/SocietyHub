-- SocietyHub core schema. Run this in Supabase SQL Editor.
create type public.member_status as enum ('active', 'inactive', 'pending');
create type public.request_status as enum ('open', 'in_progress', 'resolved');
create type public.attendance_status as enum ('present', 'late', 'absent', 'leave');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  phone text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  flat_number text not null,
  tower text,
  status public.member_status not null default 'pending',
  joined_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,
  phone text,
  shift text,
  joined_on date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'General',
  status public.request_status not null default 'open',
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  assigned_worker_id uuid references public.workers(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_to text,
  expense_date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.worker_attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  attendance_date date not null default current_date,
  status public.attendance_status not null default 'present',
  check_in time,
  check_out time,
  notes text,
  unique (worker_id, attendance_date)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.workers enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.expenses enable row level security;
alter table public.worker_attendance enable row level security;
alter table public.notices enable row level security;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);
create policy "Members can read their own record" on public.members for select using (user_id = auth.uid());
create policy "Members can create requests" on public.maintenance_requests for insert with check (member_id in (select id from public.members where user_id = auth.uid()));
create policy "Members can read their requests" on public.maintenance_requests for select using (member_id in (select id from public.members where user_id = auth.uid()));
create policy "Authenticated users can read active notices" on public.notices for select using (auth.role() = 'authenticated' and (expires_at is null or expires_at > now()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New member'), 'member');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
