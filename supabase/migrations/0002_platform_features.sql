create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.service_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (length(trim(body)) > 0),
  attachment_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  artisan_id uuid not null references public.artisan_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, artisan_id)
);

create table public.artisan_verification_requests (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisan_profiles(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  documents jsonb not null default '[]'::jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_note text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id),
  target_user_id uuid references auth.users(id),
  target_message_id uuid references public.messages(id) on delete set null,
  target_request_id uuid references public.service_requests(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','under_review','resolved','dismissed')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android','ios','web')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index service_requests_status_idx on public.service_requests(status);
create index service_requests_commune_idx on public.service_requests(commune_id);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create unique index artisan_verification_pending_idx on public.artisan_verification_requests(artisan_id) where status = 'pending';

alter table public.request_status_history enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.artisan_verification_requests enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.platform_settings enable row level security;

create policy "request history participants read" on public.request_status_history for select using (
  exists (select 1 from public.service_requests r where r.id = request_id and (r.customer_id = auth.uid() or r.artisan_id = auth.uid()))
  or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')
);
create policy "request history participants insert" on public.request_status_history for insert with check (changed_by = auth.uid());

create policy "conversation members read own" on public.conversation_members for select using (user_id = auth.uid());
create policy "conversation members insert own" on public.conversation_members for insert with check (user_id = auth.uid());
create policy "conversation participant read" on public.conversations for select using (
  exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid())
);
create policy "conversation member messages read" on public.messages for select using (
  exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
);
create policy "conversation member messages insert" on public.messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
);

create policy "customer favorites own" on public.favorites for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "artisan verification own read" on public.artisan_verification_requests for select using (artisan_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
create policy "artisan verification own insert" on public.artisan_verification_requests for insert with check (artisan_id = auth.uid());
create policy "admin verification update" on public.artisan_verification_requests for update using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')) with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "reports own or admin read" on public.reports for select using (reporter_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
create policy "authenticated report insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "admin report update" on public.reports for update using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator')) with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

create policy "notifications own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "device tokens own" on public.device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "platform settings admin read" on public.platform_settings for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
create policy "platform settings admin write" on public.platform_settings for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
