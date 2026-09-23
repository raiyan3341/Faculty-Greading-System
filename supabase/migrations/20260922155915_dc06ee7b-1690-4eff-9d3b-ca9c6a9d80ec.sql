
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  department text NOT NULL,
  subject text NOT NULL,
  section text NOT NULL,
  semester text NOT NULL,
  academic_year text NOT NULL,
  description text,
  room text,
  schedule text,
  class_code text NOT NULL UNIQUE,
  weights jsonb NOT NULL DEFAULT '{"Attendance":10,"CT":20,"Quiz":10,"Presentation":10,"Midterm":20,"Final":30}'::jsonb,
  grading_scale jsonb NOT NULL DEFAULT '[{"grade":"A+","min":90},{"grade":"A","min":85},{"grade":"A-","min":80},{"grade":"B+","min":75},{"grade":"B","min":70},{"grade":"B-","min":65},{"grade":"C+","min":60},{"grade":"C","min":55},{"grade":"D","min":50},{"grade":"F","min":0}]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  roll text NOT NULL,
  email text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, roll)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

CREATE OR REPLACE FUNCTION public.is_class_owner(_class uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class AND owner_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_class_member(_class uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.my_student_id(_class uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE class_id = _class AND user_id = auth.uid() LIMIT 1
$$;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_class_member(id));
CREATE POLICY "classes_insert" ON public.classes FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "classes_update" ON public.classes FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "classes_delete" ON public.classes FOR DELETE TO authenticated USING (owner_id = auth.uid());

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select" ON public.class_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_class_owner(class_id));
CREATE POLICY "members_insert_self" ON public.class_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete" ON public.class_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_class_owner(class_id));

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR (public.is_class_member(class_id) AND user_id = auth.uid()));
CREATE POLICY "students_write" ON public.students FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TYPE public.attendance_status AS ENUM ('present','absent','late');

CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_sessions_select" ON public.attendance_sessions FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));
CREATE POLICY "att_sessions_write" ON public.attendance_sessions FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  UNIQUE (session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_records_select" ON public.attendance_records FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR student_id = public.my_student_id(class_id));
CREATE POLICY "att_records_write" ON public.attendance_records FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'CT',
  max_marks numeric NOT NULL CHECK (max_marks > 0),
  assessment_date date,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessments_select" ON public.assessments FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));
CREATE POLICY "assessments_write" ON public.assessments FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
GRANT ALL ON public.marks TO service_role;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marks_select" ON public.marks FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR student_id = public.my_student_id(class_id));
CREATE POLICY "marks_write" ON public.marks FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE OR REPLACE FUNCTION public.validate_mark() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m numeric;
BEGIN
  SELECT max_marks INTO m FROM public.assessments WHERE id = NEW.assessment_id;
  IF NEW.score IS NOT NULL AND (NEW.score < 0 OR NEW.score > m) THEN
    RAISE EXCEPTION 'Score must be between 0 and %', m;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER validate_mark_trg BEFORE INSERT OR UPDATE ON public.marks FOR EACH ROW EXECUTE FUNCTION public.validate_mark();

CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  body text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices_select" ON public.notices FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));
CREATE POLICY "notices_write" ON public.notices FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON public.resources FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));
CREATE POLICY "resources_write" ON public.resources FOR ALL TO authenticated USING (public.is_class_owner(class_id)) WITH CHECK (public.is_class_owner(class_id));

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  notice_id uuid REFERENCES public.notices(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (public.is_class_owner(class_id) OR public.is_class_member(class_id));
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND (public.is_class_owner(class_id) OR public.is_class_member(class_id)));
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_class_owner(class_id));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_marks_class ON public.marks(class_id);
CREATE INDEX idx_att_records_class ON public.attendance_records(class_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);
