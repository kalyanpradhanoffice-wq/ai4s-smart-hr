-- AI4S Smart HR - Supplementary Schema
-- Run this in your Supabase SQL Editor to enable full data persistence

-- 0. Final Comprehensive Fixes for Profiles Table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Confirm';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary_basic NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary_hra NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status JSONB DEFAULT '{}'::jsonb;

-- 1. Leaves
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    current_level INTEGER DEFAULT 1,
    approvals JSONB DEFAULT '[]'::jsonb,
    applied_on TIMESTAMPTZ DEFAULT now()
);

-- 2. Leave Balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    cl INTEGER DEFAULT 12,
    el INTEGER DEFAULT 15,
    sl INTEGER DEFAULT 12,
    ml INTEGER DEFAULT 180,
    pl INTEGER DEFAULT 15,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 3. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    punch_in TEXT,
    punch_out TEXT,
    clock_in TEXT, -- Migration support
    clock_out TEXT, -- Migration support
    location TEXT DEFAULT 'office',
    hr_corrected BOOLEAN DEFAULT false,
    half_day_type TEXT,
    regularized BOOLEAN DEFAULT false,
    UNIQUE(user_id, date)
);

-- 4. Regularization Requests
CREATE TABLE IF NOT EXISTS public.regularizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    correction_type TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    requested_on TIMESTAMPTZ DEFAULT now(),
    approver_id UUID REFERENCES public.profiles(id),
    comments TEXT
);

-- 5. Payroll
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g. "February 2025"
    gross_salary NUMERIC NOT NULL,
    net_pay NUMERIC NOT NULL,
    deductions JSONB DEFAULT '{}'::jsonb,
    earnings JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'processed',
    processed_on TIMESTAMPTZ DEFAULT now(),
    reference_id TEXT UNIQUE
);

-- 6. OKRs
CREATE TABLE IF NOT EXISTS public.okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    quarter TEXT NOT NULL,
    overall_progress INTEGER DEFAULT 0,
    key_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Activity History
CREATE TABLE IF NOT EXISTS public.activity_history (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT now(),
    module TEXT,
    action TEXT,
    action_code TEXT,
    performed_by_id UUID REFERENCES public.profiles(id),
    performed_by_name TEXT,
    target_employee_id UUID REFERENCES public.profiles(id),
    target_employee_name TEXT,
    description TEXT,
    previous_value TEXT,
    new_value TEXT,
    reference_id TEXT
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    message TEXT,
    read BOOLEAN DEFAULT false,
    link TEXT DEFAULT '/',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Loans
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    requested_on DATE DEFAULT CURRENT_DATE,
    current_level INTEGER DEFAULT 1,
    approvals JSONB DEFAULT '[]'::jsonb
);

-- 10. Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_name TEXT,
    applied_position TEXT,
    interviewer_id UUID REFERENCES public.profiles(id),
    interview_date DATE,
    interview_time TEXT,
    status TEXT DEFAULT 'scheduled',
    assessment JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Kudos
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID REFERENCES public.profiles(id),
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Feedback (360 Degree)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID REFERENCES public.profiles(id),
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    ratings JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Salary Upgrades
CREATE TABLE IF NOT EXISTS public.salary_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_salary NUMERIC,
    proposed_salary NUMERIC,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    current_level INTEGER DEFAULT 1,
    approvals JSONB DEFAULT '[]'::jsonb,
    requested_on TIMESTAMPTZ DEFAULT now()
);

-- 14. Security Config
CREATE TABLE IF NOT EXISTS public.security_config (
    id TEXT PRIMARY KEY DEFAULT 'system_config',
    config JSONB NOT NULL
);

-- 15. Custom Roles
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    color TEXT,
    is_system_role BOOLEAN DEFAULT false
);
