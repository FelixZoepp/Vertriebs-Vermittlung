-- Add subscription tracking columns to partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS abo_status text DEFAULT 'keins' CHECK (abo_status IN ('keins', 'aktiv', 'gekuendigt', 'ueberfaellig'));
