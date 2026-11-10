-- 1. Ensure joining a class via class code ONLY adds the user to class_members
--    and NEVER inserts a new row into public.students (only faculty adds students).
--    If faculty already added a matching student email, link user_id without inserting.
CREATE OR REPLACE FUNCTION public.join_class(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.classes;
  uid uuid := auth.uid();
  uemail text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO c FROM public.classes WHERE upper(class_code) = upper(trim(_code)) LIMIT 1;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Invalid class code'; END IF;
  IF c.owner_id = uid THEN RAISE EXCEPTION 'You are the faculty of this class'; END IF;

  INSERT INTO public.class_members (class_id, user_id) VALUES (c.id, uid)
  ON CONFLICT (class_id, user_id) DO NOTHING;

  SELECT email INTO uemail FROM public.profiles WHERE id = uid;
  IF uemail IS NOT NULL THEN
    UPDATE public.students
       SET user_id = uid
     WHERE class_id = c.id
       AND user_id IS NULL
       AND lower(email) = lower(uemail);
  END IF;

  RETURN c.id;
END; $$;

-- 2. Allow joined class members to match their student row even if faculty added it after join.
CREATE OR REPLACE FUNCTION public.my_student_id(_class uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id
  FROM public.students s
  LEFT JOIN public.profiles p ON p.id = auth.uid()
  WHERE s.class_id = _class
    AND public.is_class_member(_class)
    AND (
      s.user_id = auth.uid()
      OR (s.email IS NOT NULL AND p.email IS NOT NULL AND lower(s.email) = lower(p.email))
    )
  ORDER BY (s.user_id = auth.uid()) DESC
  LIMIT 1
$$;

-- 3. Allow joined class members read-only SELECT access to all students,
--    attendance records, and marks in classes they have joined.
--    Write policies remain strictly limited to class faculty (is_class_owner).
DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));

DROP POLICY IF EXISTS "att_records_select" ON public.attendance_records;
CREATE POLICY "att_records_select" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));

DROP POLICY IF EXISTS "marks_select" ON public.marks;
CREATE POLICY "marks_select" ON public.marks
  FOR SELECT TO authenticated
  USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));

-- 4. Secure RPC so faculty can notify all members of their class
--    (direct client inserts for other user_ids are blocked by notifications_own RLS).
CREATE OR REPLACE FUNCTION public.notify_class_members(
  _class uuid,
  _kind text,
  _title text,
  _body text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT public.is_class_owner(_class) THEN
    RAISE EXCEPTION 'Only class faculty can send class notifications';
  END IF;

  INSERT INTO public.notifications (user_id, class_id, kind, title, body)
  SELECT m.user_id, _class, _kind, _title, _body
  FROM public.class_members m
  WHERE m.class_id = _class AND m.user_id <> uid;
END; $$;
REVOKE ALL ON FUNCTION public.notify_class_members(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_class_members(uuid, text, text, text) TO authenticated;

-- 5. Secure RPC so joined students can see their class faculty's name
--    without opening up global SELECT access on public.profiles.
CREATE OR REPLACE FUNCTION public.get_class_faculty_name(_class uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(p.full_name, p.email)
  FROM public.classes c
  LEFT JOIN public.profiles p ON p.id = c.owner_id
  WHERE c.id = _class
    AND (c.owner_id = auth.uid() OR public.is_class_member(_class))
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_class_faculty_name(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_class_faculty_name(uuid) TO authenticated;
