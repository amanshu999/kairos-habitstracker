-- ==============================================================================
-- init.habits PostgreSQL Database Schema for Supabase
-- Terminal Habit Tracker - Cloud Persistence & Row-Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'developer@terminal',
  theme TEXT DEFAULT 'terminal-emerald',
  sound_effects BOOLEAN DEFAULT TRUE,
  crt_effects BOOLEAN DEFAULT FALSE,
  week_starts_on TEXT DEFAULT 'monday',
  streak_protection_tokens INTEGER DEFAULT 3,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  type TEXT NOT NULL CHECK (type IN ('boolean', 'numeric', 'timer')),
  target_value NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'custom')),
  custom_days INTEGER[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  color TEXT,
  order_index INTEGER DEFAULT 0
);

-- Enable RLS for Habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" 
  ON public.habits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" 
  ON public.habits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" 
  ON public.habits FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" 
  ON public.habits FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_archived ON public.habits (user_id, archived);

-- 3. Habit Logs Table (Daily Completions)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, habit_id, date)
);

-- Enable RLS for Habit Logs
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs" 
  ON public.habit_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" 
  ON public.habit_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" 
  ON public.habit_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" 
  ON public.habit_logs FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON public.habit_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON public.habit_logs (habit_id, date);

-- 4. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  habit_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routines" 
  ON public.routines FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines" 
  ON public.routines FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" 
  ON public.routines FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" 
  ON public.routines FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines (user_id);
