-- Create schools table first (no dependencies)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  principal_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for profile management (now schools exists)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'admin', 'government')),
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT,
  teacher_id UUID REFERENCES public.users(id),
  academic_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL, -- School-assigned student ID
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, student_id)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID NOT NULL REFERENCES public.users(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT DEFAULT 'manual' CHECK (method IN ('manual', 'facial_recognition', 'rfid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create attendance_sessions table for tracking when attendance is taken
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT DEFAULT 'daily' CHECK (session_type IN ('daily', 'morning', 'afternoon')),
  started_by UUID NOT NULL REFERENCES public.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_students INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  UNIQUE(class_id, date, session_type)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for schools table
CREATE POLICY "Users can view schools" ON public.schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = schools.id OR users.role = 'government')
    )
  );

-- RLS Policies for classes table
CREATE POLICY "Users can view classes in their school" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = classes.school_id OR users.role = 'government')
    )
  );

CREATE POLICY "Teachers can manage their classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.id = classes.teacher_id OR users.role IN ('admin', 'government'))
    )
  );

-- RLS Policies for students table
CREATE POLICY "Users can view students in their school" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = students.school_id OR users.role = 'government')
    )
  );

-- RLS Policies for attendance_records table
CREATE POLICY "Users can view attendance in their school" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = attendance_records.student_id 
      AND (u.school_id = s.school_id OR u.role = 'government')
    )
  );

CREATE POLICY "Teachers can manage attendance" ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = attendance_records.student_id 
      AND (u.school_id = s.school_id AND u.role IN ('teacher', 'admin'))
    )
  );

-- RLS Policies for attendance_sessions table
CREATE POLICY "Users can view attendance sessions in their school" ON public.attendance_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.users u ON u.id = auth.uid()
      WHERE c.id = attendance_sessions.class_id 
      AND (u.school_id = c.school_id OR u.role = 'government')
    )
  );

CREATE POLICY "Teachers can manage attendance sessions" ON public.attendance_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.users u ON u.id = auth.uid()
      WHERE c.id = attendance_sessions.class_id 
      AND (u.school_id = c.school_id AND u.role IN ('teacher', 'admin'))
    )
  );
