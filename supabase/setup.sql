create table public.transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  purchase_date timestamp with time zone not null default now(),
  fiat_amount numeric(20, 2) not null,
  btc_amount numeric(20, 8) not null,
  fee numeric(20, 2) null default 0,
  exchange_name text null,
  created_at timestamp with time zone null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint check_not_future_date check ((purchase_date <= CURRENT_TIMESTAMP)),
  constraint check_positive_values check (
    (
      (fiat_amount > (0)::numeric)
      and (btc_amount > (0)::numeric)
      and (fee >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own transactions" 
ON transactions FOR ALL 
USING (auth.uid() = user_id);

create view public.dca_summary as
select
  user_id,
  sum(fiat_amount) as total_modal,
  sum(btc_amount) as total_btc,
  COALESCE(
    sum(fiat_amount) / NULLIF(sum(btc_amount), 0::numeric),
    0::numeric
  ) as average_price,
  count(id) as total_transactions
from
  transactions
group by
  user_id;