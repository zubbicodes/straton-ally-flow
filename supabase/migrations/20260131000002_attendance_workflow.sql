ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_total_minutes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_work_minutes INTEGER,
ADD COLUMN IF NOT EXISTS check_in_ip TEXT,
ADD COLUMN IF NOT EXISTS check_out_ip TEXT,
ADD COLUMN IF NOT EXISTS check_in_location JSONB,
ADD COLUMN IF NOT EXISTS check_out_location JSONB;

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date);

DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance;

CREATE POLICY "Users can insert own attendance" ON public.attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.employees
      WHERE employees.id = attendance.employee_id
        AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own attendance" ON public.attendance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.employees
      WHERE employees.id = attendance.employee_id
        AND employees.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.employees
      WHERE employees.id = attendance.employee_id
        AND employees.user_id = auth.uid()
    )
  );
