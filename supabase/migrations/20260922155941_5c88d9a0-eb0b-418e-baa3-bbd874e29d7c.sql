
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_mark() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_class_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_class_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_student_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_student_id(uuid) TO authenticated;
