-- Add referral tracking to candidates
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS referred_by bigint REFERENCES public.candidates(id);

-- Referral rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id bigint generated always as identity primary key,
  referrer_id bigint not null references public.candidates(id),
  referred_id bigint not null references public.candidates(id),
  status text not null default 'ausstehend' check (status in ('ausstehend', 'qualifiziert', 'ausgezahlt')),
  created_at timestamptz not null default now(),
  unique(referred_id)
);

-- RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referrals" ON public.referral_rewards
  FOR ALL USING (public.is_admin());
