-- Script to fix users who might not have roles assigned properly
-- This can happen if users were created before the trigger was set up

-- Update any users without roles to have 'teacher' as default
UPDATE public.users 
SET role = 'teacher' 
WHERE role IS NULL OR role = '';

-- Check for users in auth.users who don't have corresponding entries in public.users
-- and create them with data from their metadata
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'User'),
  COALESCE(au.raw_user_meta_data ->> 'role', 'teacher')
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  role = COALESCE(EXCLUDED.role, users.role);

-- Display current user roles for verification
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at
FROM public.users u
ORDER BY u.created_at DESC;
