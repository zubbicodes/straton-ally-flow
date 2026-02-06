-- Allow multiple early checkout requests per employee per day (max 3 enforced in app).
-- Drop the unique constraint on (employee_id, date) if it exists.
ALTER TABLE public.early_checkout_requests
  DROP CONSTRAINT IF EXISTS early_checkout_requests_employee_id_date_key;
