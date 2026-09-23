
CREATE OR REPLACE FUNCTION public.lookup_class(_code text)
RETURNS TABLE (id uuid, department text, subject text, section text, semester text, academic_year text, faculty_name text, already_member boolean, is_owner boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.department, c.subject, c.section, c.semester, c.academic_year,
         p.full_name,
         EXISTS (SELECT 1 FROM public.class_members m WHERE m.class_id = c.id AND m.user_id = auth.uid()),
         c.owner_id = auth.uid()
  FROM public.classes c
  LEFT JOIN public.profiles p ON p.id = c.owner_id
  WHERE upper(c.class_code) = upper(trim(_code))
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.lookup_class(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_class(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_class(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.classes;
  uid uuid := auth.uid();
  uemail text;
  uname text;
  sid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO c FROM public.classes WHERE upper(class_code) = upper(trim(_code)) LIMIT 1;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Invalid class code'; END IF;
  IF c.owner_id = uid THEN RAISE EXCEPTION 'You are the faculty of this class'; END IF;

  SELECT email, full_name INTO uemail, uname FROM public.profiles WHERE id = uid;

  INSERT INTO public.class_members (class_id, user_id) VALUES (c.id, uid)
  ON CONFLICT (class_id, user_id) DO NOTHING;

  SELECT id INTO sid FROM public.students
   WHERE class_id = c.id AND (user_id = uid OR (uemail IS NOT NULL AND lower(email) = lower(uemail)))
   LIMIT 1;

  IF sid IS NULL THEN
    INSERT INTO public.students (class_id, name, roll, email, user_id)
    VALUES (c.id, COALESCE(uname, uemail, 'Student'), 'NEW-' || left(replace(uid::text,'-',''), 6), uemail, uid)
    RETURNING id INTO sid;
  ELSE
    UPDATE public.students SET user_id = uid, email = COALESCE(email, uemail) WHERE id = sid;
  END IF;

  RETURN c.id;
END; $$;
REVOKE ALL ON FUNCTION public.join_class(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class(text) TO authenticated;
