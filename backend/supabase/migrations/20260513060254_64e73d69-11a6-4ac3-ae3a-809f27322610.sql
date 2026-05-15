CREATE TABLE public.monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  budget numeric NOT NULL DEFAULT 10000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own monthly budgets" ON public.monthly_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own monthly budgets" ON public.monthly_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own monthly budgets" ON public.monthly_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own monthly budgets" ON public.monthly_budgets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_monthly_budgets_updated_at BEFORE UPDATE ON public.monthly_budgets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();