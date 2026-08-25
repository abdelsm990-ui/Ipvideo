-- ============================================
-- Ipvideo - Supabase Database Schema (Points System)
-- ============================================

-- Users table with points system
-- Plan Pro = 1000 points/month = $25
-- Cost: 40 points per 30-second video (= ~1.33 points/second)
-- Free trial = 120 points (3 videos of 30s)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  password text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  points_balance integer not null default 0,
  points_used integer not null default 0,
  paypal_subscription_id text,
  paypal_order_id text,
  trial_ends_at timestamp with time zone,
  is_trial_used boolean not null default false,
  video_count integer not null default 0,
  voice_credits integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Videos table
-- Each video records its point cost
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  prompt text not null,
  style text not null default 'realistic',
  duration integer not null default 15,
  quality text not null default '1080p',
  ratio text not null default '16:9',
  music text default 'none',
  points_cost integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'generating', 'completed', 'failed')),
  replicate_prediction_id text,
  video_url text,
  thumbnail_url text,
  error_message text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Point transactions history (for transparency)
create table if not exists point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('credit', 'debit')),
  description text not null,
  related_video_id uuid references videos(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  paypal_subscription_id text not null unique,
  status text not null default 'active' check (status in ('active', 'cancelled', 'suspended')),
  plan text not null check (plan in ('pro')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Indexes
create index idx_videos_user_id on videos(user_id);
create index idx_videos_created_at on videos(created_at desc);
create index idx_videos_status on videos(status);
create index idx_transactions_user_id on point_transactions(user_id);

-- Row Level Security (RLS)
alter table users enable row level security;
alter table videos enable row level security;
alter table subscriptions enable row level security;
alter table point_transactions enable row level security;
