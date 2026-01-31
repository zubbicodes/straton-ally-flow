ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_office_id ON public.employees(office_id);
