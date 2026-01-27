-- Create offices table
CREATE TABLE public.offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create office_settings table for timing and IP configuration
CREATE TABLE public.office_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '17:00:00',
    break_duration INTERVAL DEFAULT '01:00:00',
    work_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timezone TEXT NOT NULL DEFAULT 'UTC',
    allowed_ip_ranges TEXT[], -- Array of CIDR notation IP ranges
    require_ip_whitelist BOOLEAN NOT NULL DEFAULT false,
    geo_fencing_enabled BOOLEAN NOT NULL DEFAULT false,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (office_id)
);

-- Create access_control table for employee access permissions
CREATE TABLE public.access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('full', 'restricted', 'read_only')),
    allowed_areas TEXT[], -- Array of office areas employee can access
    time_restrictions JSONB, -- Flexible time restrictions per day/week
    ip_override BOOLEAN NOT NULL DEFAULT false, -- Can bypass IP restrictions
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, office_id)
);

-- Create duty_schedules table for employee duty time management
CREATE TABLE public.duty_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    schedule_name TEXT NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('regular', 'rotating', 'flexible', 'night')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTERVAL DEFAULT '00:30:00',
    work_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create access_logs table for tracking access attempts
CREATE TABLE public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('entry', 'exit', 'denied', 'override')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    location_data JSONB, -- GPS coordinates if available
    access_method TEXT, -- 'app', 'web', 'biometric', 'card', etc.
    success BOOLEAN NOT NULL DEFAULT true,
    denial_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create office_departments table to link departments to offices
CREATE TABLE public.office_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (office_id, department_id)
);

-- Enable RLS on new tables
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offices
CREATE POLICY "Everyone can view offices" ON public.offices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage offices" ON public.offices
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for office_settings
CREATE POLICY "Everyone can view office settings" ON public.office_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage office settings" ON public.office_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for access_control
CREATE POLICY "Users can view own access control" ON public.access_control
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = access_control.employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage access control" ON public.access_control
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for duty_schedules
CREATE POLICY "Users can view own duty schedules" ON public.duty_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = duty_schedules.employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage duty schedules" ON public.duty_schedules
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for access_logs
CREATE POLICY "Users can view own access logs" ON public.access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = access_logs.employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all access logs" ON public.access_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for office_departments
CREATE POLICY "Everyone can view office departments" ON public.office_departments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage office departments" ON public.office_departments
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_offices_updated_at
    BEFORE UPDATE ON public.offices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_settings_updated_at
    BEFORE UPDATE ON public.office_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_access_control_updated_at
    BEFORE UPDATE ON public.access_control
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_duty_schedules_updated_at
    BEFORE UPDATE ON public.duty_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default office
INSERT INTO public.offices (name, address, city, country, postal_code, phone, email) VALUES
    ('Headquarters', '123 Business Avenue', 'New York', 'United States', '10001', '+1-555-0123', 'hq@stratonally.com');

-- Insert default office settings
INSERT INTO public.office_settings (
    office_id, 
    work_start_time, 
    work_end_time, 
    break_duration, 
    work_days, 
    timezone,
    allowed_ip_ranges,
    require_ip_whitelist
) VALUES (
    (SELECT id FROM public.offices WHERE name = 'Headquarters'),
    '09:00:00',
    '17:00:00',
    '01:00:00',
    ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    'America/New_York',
    ARRAY['192.168.1.0/24', '10.0.0.0/8'],
    false
);

-- Create indexes for performance
CREATE INDEX idx_offices_active ON public.offices(is_active);
CREATE INDEX idx_office_settings_office_id ON public.office_settings(office_id);
CREATE INDEX idx_access_control_employee ON public.access_control(employee_id);
CREATE INDEX idx_access_control_office ON public.access_control(office_id);
CREATE INDEX idx_duty_schedules_employee ON public.duty_schedules(employee_id);
CREATE INDEX idx_duty_schedules_office ON public.duty_schedules(office_id);
CREATE INDEX idx_access_logs_employee ON public.access_logs(employee_id);
CREATE INDEX idx_access_logs_office ON public.access_logs(office_id);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp);
CREATE INDEX idx_office_departments_office ON public.office_departments(office_id);
CREATE INDEX idx_office_departments_department ON public.office_departments(department_id);
