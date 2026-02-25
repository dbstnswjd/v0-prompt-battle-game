create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  round integer not null,
  topic text not null,
  prompt text not null,
  total_score integer not null,
  idea_score integer not null,
  prompt_score integer not null,
  feedback text,
  created_at timestamp with time zone default now()
);

-- RLS 비활성화 (인증 없이 저장하기 위해)
alter table public.game_results enable row level security;

-- 누구나 삽입 가능
create policy "Anyone can insert game results"
  on public.game_results
  for insert
  with check (true);

-- 누구나 조회 가능
create policy "Anyone can view game results"
  on public.game_results
  for select
  using (true);
