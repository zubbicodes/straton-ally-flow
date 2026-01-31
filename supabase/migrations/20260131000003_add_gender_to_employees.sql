ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS gender TEXT;

DO $$
BEGIN
  ALTER TABLE public.employees
    ADD CONSTRAINT employees_gender_check
    CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
