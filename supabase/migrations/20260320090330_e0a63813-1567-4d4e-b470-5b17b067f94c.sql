
CREATE TABLE public.recharge_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL UNIQUE,
  label text NOT NULL,
  minutes integer NOT NULL,
  bonus integer NOT NULL DEFAULT 0,
  price integer NOT NULL,
  per_min_text text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  highlight boolean NOT NULL DEFAULT false,
  is_night boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recharge_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage packages" ON public.recharge_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active packages" ON public.recharge_packages
  FOR SELECT TO public
  USING (is_active = true);

-- Seed with existing hardcoded plans
INSERT INTO public.recharge_packages (plan_id, label, minutes, bonus, price, per_min_text, tagline, features, highlight, is_night, sort_order) VALUES
  ('30min', 'Starter', 30, 0, 199, '₹6.6/min', 'Perfect first date ☕', '{}', false, false, 1),
  ('60min', 'Value', 60, 5, 249, '₹3.8/min', 'A real conversation ❤️', '{"+5 bonus min free"}', false, false, 2),
  ('3hr', '3 Hours', 180, 20, 499, '₹2.5/min', 'Deep connection 💕', '{"+20 bonus min free","Best for long chats"}', false, false, 3),
  ('night', 'Night Unlimited', 300, 0, 499, '12AM–5AM', 'Unlimited chat tonight 🌙', '{"Unlimited from 12 AM to 5 AM","Talk to anyone, no limits tonight!","Today only offer 🔥"}', true, true, 4),
  ('fullday', 'Full Day Unlimited', 720, 60, 699, '₹0.9/min', 'Chat all day, any companion 🔥', '{"720 min (12 hours)","+60 bonus min FREE","Unlimited users","Lowest rate ever"}', true, false, 5),
  ('10day', '10 Days Unlimited', 6000, 600, 999, '₹0.15/min', '10 hours/day for 10 days 👑', '{"6000 min total","+600 bonus min FREE","Unlimited companions","Build real connections","BEST VALUE 💎"}', true, false, 6);
