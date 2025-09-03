---

📄 **schema.sql**  

```sql
-- Run this in Supabase SQL editor to create the loads table
create table if not exists public.loads (
  id bigserial primary key,
  title text not null,
  company text,
  origin text,
  destination text,
  pickup_date date,
  equipment text,
  weight_tons numeric,
  rate_zar numeric,
  sector text,
  commodity_type text,
  status text default 'open',
  created_at timestamptz default now()
);
