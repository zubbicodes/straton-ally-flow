-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create user_status enum
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'locked');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create departments table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create employees table (HR-specific data)
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    employee_id TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES public.departments(id),
    designation TEXT,
    joining_date DATE NOT NULL,
    phone TEXT,
    address TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create salaries table
CREATE TABLE public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    salary_type TEXT NOT NULL CHECK (salary_type IN ('monthly', 'hourly')),
    amount DECIMAL(12, 2) NOT NULL,
    effective_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    in_time TIME,
    out_time TIME,
    break_duration INTERVAL DEFAULT '00:00:00',
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, date)
);

-- Create login_logs table
CREATE TABLE public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departments
CREATE POLICY "Everyone can view departments" ON public.departments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for employees
CREATE POLICY "Users can view own employee record" ON public.employees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all employees" ON public.employees
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage employees" ON public.employees
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for salaries
CREATE POLICY "Users can view own salary" ON public.salaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = salaries.employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all salaries" ON public.salaries
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Users can view own attendance" ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE employees.id = attendance.employee_id 
            AND employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all attendance" ON public.attendance
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for login_logs
CREATE POLICY "Users can view own login logs" ON public.login_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login logs" ON public.login_logs
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
    ('Engineering', 'Software development and technical operations'),
    ('Human Resources', 'Employee management and recruitment'),
    ('Finance', 'Financial operations and accounting'),
    ('Marketing', 'Brand management and marketing operations'),
    ('Operations', 'Business operations and logistics');

-- Create indexes for performance
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_department_id ON public.employees(department_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);
CREATE INDEX idx_salaries_employee_id ON public.salaries(employee_id);
CREATE INDEX idx_login_logs_user_id ON public.login_logs(user_id);