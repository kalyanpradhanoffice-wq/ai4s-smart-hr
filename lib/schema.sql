-- AI4S Smart HR - Supplementary Schema
-- Run this in your Supabase SQL Editor to enable full data persistence

-- 0. Comprehensive Fixes for Profiles Table
-- Run this to ensure all required employee fields exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Confirm';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary_basic NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary_hra NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_color TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status JSONB DEFAULT '{}'::jsonb;

-- Leave Balances
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

-- Regularization Requests
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

-- Loans
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

-- Notifications
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

-- Interviews
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

-- Kudos
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID REFERENCES public.profiles(id),
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback (360 Degree)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id UUID REFERENCES public.profiles(id),
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    ratings JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Salary Upgrades
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

-- Security Config
CREATE TABLE IF NOT EXISTS public.security_config (
    id TEXT PRIMARY KEY DEFAULT 'system_config',
    config JSONB NOT NULL
);

-- Custom Roles
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    color TEXT,
    is_system_role BOOLEAN DEFAULT false
);

-- Optional: Enable RLS for all newly created tables if needed
-- ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
-- ... (You can add RLS policies here or in the Supabase Dashboard)
