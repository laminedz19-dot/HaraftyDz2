create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.service_requests(id) on delete set null,
  payer_id uuid references auth.users(id),
  artisan_id uuid references public.artisan_profiles(user_id),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'DZD' check (currency = 'DZD'),
  transaction_type text not null check (transaction_type in ('service_payment','refund','platform_fee','artisan_payout')),
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  provider_reference text unique,
  created_at timestamptz not null default now()
);

create index financial_transactions_created_idx on public.financial_transactions(created_at desc);
create index financial_transactions_status_idx on public.financial_transactions(status);
alter table public.financial_transactions enable row level security;

create policy "admin financial reports read" on public.financial_transactions
for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
