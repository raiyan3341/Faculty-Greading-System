
CREATE POLICY "class_resources_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'class-resources' AND (
  public.is_class_owner(((storage.foldername(name))[1])::uuid) OR public.is_class_member(((storage.foldername(name))[1])::uuid)
));
CREATE POLICY "class_resources_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'class-resources' AND public.is_class_owner(((storage.foldername(name))[1])::uuid));
CREATE POLICY "class_resources_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'class-resources' AND public.is_class_owner(((storage.foldername(name))[1])::uuid));
