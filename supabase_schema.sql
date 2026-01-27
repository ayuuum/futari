-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create couples table
create table public.couples (
  id uuid primary key default uuid_generate_v4(),
  name text,
  anniversary_date date,
  started_living_date date,
  invite_code text unique not null default substring(md5(random()::text) from 0 for 7),
  expense_ratio_me integer default 50,
  expense_ratio_partner integer default 50,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create users table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  avatar_url text,
  status_message text,
  couple_id uuid references public.couples(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create savings_goals table
create table public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) not null,
  title text not null,
  target_amount integer not null,
  current_amount integer default 0,
  deadline date,
  emoji text,
  color text,
  status text default 'active' check (status in ('active', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create savings_logs table
create table public.savings_logs (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references public.savings_goals(id) not null,
  user_id uuid references public.users(id) not null,
  amount integer not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)

-- Enable RLS
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_logs enable row level security;

-- Policies for users
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Policies for couples
-- (Simplified for initial setup: Check if user belongs to the couple)
create policy "Users can view their couple data"
  on public.couples for select
  using (
    id in (
      select couple_id from public.users where id = auth.uid()
    )
  );

create policy "Users can update their couple data"
  on public.couples for update
  using (
    id in (
      select couple_id from public.users where id = auth.uid()
    )
  );

-- Policies for savings_goals
create policy "Users can view goals of their couple"
  on public.savings_goals for select
  using (
    couple_id in (
      select couple_id from public.users where id = auth.uid()
    )
  );

create policy "Users can insert goals for their couple"
  on public.savings_goals for insert
  with check (
    couple_id in (
      select couple_id from public.users where id = auth.uid()
    )
  );

create policy "Users can update goals of their couple"
  on public.savings_goals for update
  using (
    couple_id in (
      select couple_id from public.users where id = auth.uid()
    )
  );

-- Policies for savings_logs
create policy "Users can view logs of their couple's goals"
  on public.savings_logs for select
  using (
    goal_id in (
      select id from public.savings_goals where couple_id in (
        select couple_id from public.users where id = auth.uid()
      )
    )
  );

create policy "Users can insert logs for their couple's goals"
  on public.savings_logs for insert
  with check (
    goal_id in (
      select id from public.savings_goals where couple_id in (
        select couple_id from public.users where id = auth.uid()
      )
    )
  );

-- Trigger to handle new user signup (display_name from meta; fallback to 'name')
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== New tables ==========

-- expenses
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  paid_by uuid references public.users(id) not null,
  amount integer not null,
  category text not null,
  description text,
  date date not null default (current_date),
  is_shared boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- chores
create table public.chores (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  name text not null,
  category text not null,
  frequency text not null default '週1',
  assigned_to uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- chore_completions
create table public.chore_completions (
  id uuid primary key default uuid_generate_v4(),
  chore_id uuid references public.chores(id) on delete cascade not null,
  completed_by uuid references public.users(id) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- shopping_items
create table public.shopping_items (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  name text not null,
  category text,
  estimated_price integer,
  is_purchased boolean default false,
  purchased_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- calendar_events
create table public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  date date not null,
  category text default 'other',
  reminder boolean default false,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- recurring_expenses
create table public.recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  name text not null,
  amount integer not null,
  category text not null,
  payment_day integer not null check (payment_day >= 1 and payment_day <= 31),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- anniversaries
create table public.anniversaries (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  date date not null,
  emoji text default '💕',
  is_yearly boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- rules
create table public.rules (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  title text not null,
  category text default 'other',
  created_by uuid references public.users(id),
  last_confirmed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on new tables
alter table public.expenses enable row level security;
alter table public.chores enable row level security;
alter table public.chore_completions enable row level security;
alter table public.shopping_items enable row level security;
alter table public.calendar_events enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.anniversaries enable row level security;
alter table public.rules enable row level security;

-- Helper: user's couple_id
create or replace function public.my_couple_id()
returns uuid as $$
  select couple_id from public.users where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- RLS policies: expenses
create policy "Users can view expenses of their couple"
  on public.expenses for select using (couple_id = public.my_couple_id());
create policy "Users can insert expenses for their couple"
  on public.expenses for insert with check (couple_id = public.my_couple_id());
create policy "Users can update expenses of their couple"
  on public.expenses for update using (couple_id = public.my_couple_id());
create policy "Users can delete expenses of their couple"
  on public.expenses for delete using (couple_id = public.my_couple_id());

-- RLS policies: chores
create policy "Users can view chores of their couple"
  on public.chores for select using (couple_id = public.my_couple_id());
create policy "Users can insert chores for their couple"
  on public.chores for insert with check (couple_id = public.my_couple_id());
create policy "Users can update chores of their couple"
  on public.chores for update using (couple_id = public.my_couple_id());
create policy "Users can delete chores of their couple"
  on public.chores for delete using (couple_id = public.my_couple_id());

-- RLS policies: chore_completions (via chore -> couple)
create policy "Users can view chore_completions of their couple"
  on public.chore_completions for select using (
    chore_id in (select id from public.chores where couple_id = public.my_couple_id())
  );
create policy "Users can insert chore_completions for their couple"
  on public.chore_completions for insert with check (
    chore_id in (select id from public.chores where couple_id = public.my_couple_id())
  );
create policy "Users can delete chore_completions of their couple"
  on public.chore_completions for delete using (
    chore_id in (select id from public.chores where couple_id = public.my_couple_id())
  );

-- RLS policies: shopping_items
create policy "Users can view shopping_items of their couple"
  on public.shopping_items for select using (couple_id = public.my_couple_id());
create policy "Users can insert shopping_items for their couple"
  on public.shopping_items for insert with check (couple_id = public.my_couple_id());
create policy "Users can update shopping_items of their couple"
  on public.shopping_items for update using (couple_id = public.my_couple_id());
create policy "Users can delete shopping_items of their couple"
  on public.shopping_items for delete using (couple_id = public.my_couple_id());

-- RLS policies: calendar_events
create policy "Users can view calendar_events of their couple"
  on public.calendar_events for select using (couple_id = public.my_couple_id());
create policy "Users can insert calendar_events for their couple"
  on public.calendar_events for insert with check (couple_id = public.my_couple_id());
create policy "Users can update calendar_events of their couple"
  on public.calendar_events for update using (couple_id = public.my_couple_id());
create policy "Users can delete calendar_events of their couple"
  on public.calendar_events for delete using (couple_id = public.my_couple_id());

-- RLS policies: recurring_expenses
create policy "Users can view recurring_expenses of their couple"
  on public.recurring_expenses for select using (couple_id = public.my_couple_id());
create policy "Users can insert recurring_expenses for their couple"
  on public.recurring_expenses for insert with check (couple_id = public.my_couple_id());
create policy "Users can update recurring_expenses of their couple"
  on public.recurring_expenses for update using (couple_id = public.my_couple_id());
create policy "Users can delete recurring_expenses of their couple"
  on public.recurring_expenses for delete using (couple_id = public.my_couple_id());

-- RLS policies: anniversaries
create policy "Users can view anniversaries of their couple"
  on public.anniversaries for select using (couple_id = public.my_couple_id());
create policy "Users can insert anniversaries for their couple"
  on public.anniversaries for insert with check (couple_id = public.my_couple_id());
create policy "Users can update anniversaries of their couple"
  on public.anniversaries for update using (couple_id = public.my_couple_id());
create policy "Users can delete anniversaries of their couple"
  on public.anniversaries for delete using (couple_id = public.my_couple_id());

-- RLS policies: rules
create policy "Users can view rules of their couple"
  on public.rules for select using (couple_id = public.my_couple_id());
create policy "Users can insert rules for their couple"
  on public.rules for insert with check (couple_id = public.my_couple_id());
create policy "Users can update rules of their couple"
  on public.rules for update using (couple_id = public.my_couple_id());
create policy "Users can delete rules of their couple"
  on public.rules for delete using (couple_id = public.my_couple_id());

-- Couples: allow authenticated users to create (first user creates couple on signup)
create policy "Authenticated users can insert couples"
  on public.couples for insert with check (auth.uid() is not null);
