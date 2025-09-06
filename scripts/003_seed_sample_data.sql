-- Insert sample school
INSERT INTO public.schools (id, name, address, district, state, principal_name, contact_phone, contact_email)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Rural Primary School',
  '123 Village Road, Rural Area',
  'Sample District',
  'Sample State',
  'Dr. Jane Smith',
  '+1234567890',
  'principal@ruralschool.edu'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample classes
INSERT INTO public.classes (id, school_id, name, grade, section, academic_year)
VALUES 
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 1A', '1', 'A', '2024-25'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 2A', '2', 'A', '2024-25'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 3A', '3', 'A', '2024-25')
ON CONFLICT (id) DO NOTHING;

-- Insert sample students
INSERT INTO public.students (school_id, class_id, student_id, full_name, date_of_birth, gender, parent_name, parent_phone)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU001', 'Rahul Kumar', '2017-05-15', 'male', 'Suresh Kumar', '+9876543210'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU002', 'Priya Sharma', '2017-08-22', 'female', 'Rajesh Sharma', '+9876543211'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU003', 'Amit Singh', '2017-03-10', 'male', 'Vikram Singh', '+9876543212'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU004', 'Sneha Patel', '2016-12-05', 'female', 'Mahesh Patel', '+9876543213'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'STU005', 'Arjun Reddy', '2016-09-18', 'male', 'Krishna Reddy', '+9876543214')
ON CONFLICT (school_id, student_id) DO NOTHING;
