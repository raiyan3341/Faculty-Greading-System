import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GradeStep, Weights } from "@/lib/grading";

export type ClassRow = {
  id: string;
  owner_id: string;
  department: string;
  subject: string;
  section: string;
  semester: string;
  academic_year: string;
  description: string | null;
  room: string | null;
  schedule: string | null;
  class_code: string;
  weights: Weights;
  grading_scale: GradeStep[];
  created_at: string;
};

export type NotificationRow = {
  id: string;
  class_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function useMyClasses(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-classes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [owned, memberships] = await Promise.all([
        supabase
          .from("classes")
          .select("*")
          .eq("owner_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("class_members")
          .select("class_id, joined_at, classes(*)")
          .eq("user_id", userId!),
      ]);
      if (owned.error) throw owned.error;
      if (memberships.error) throw memberships.error;

      const ownedRows = (owned.data ?? []) as unknown as ClassRow[];
      const joinedRows = (
        (memberships.data ?? []) as unknown as {
          class_id: string;
          joined_at: string;
          classes: ClassRow | null;
        }[]
      )
        .map((m) => m.classes)
        .filter((c): c is ClassRow => !!c && c.owner_id !== userId);

      return { owned: ownedRows, joined: joinedRows };
    },
  });
}

export function useClass(classId: string | undefined) {
  return useQuery({
    queryKey: ["class", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ClassRow) ?? null;
    },
  });
}

export function useClassStudentCount(classIds: string[]) {
  const key = [...classIds].sort().join(",");
  return useQuery({
    queryKey: ["student-counts", key],
    enabled: classIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, class_id")
        .in("class_id", classIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as { id: string; class_id: string }[]) {
        counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });
}

/** Notify every member of a class (except the actor) about an event. */
export async function notifyClass(opts: {
  classId: string;
  actorId: string;
  kind: string;
  title: string;
  body?: string;
}) {
  const { error } = await supabase.rpc("notify_class_members", {
    _class: opts.classId,
    _kind: opts.kind,
    _title: opts.title,
    _body: opts.body ?? null,
  });
  if (error) {
    console.warn("Could not notify class members:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Per-class data. Every query is scoped by class_id, and RLS enforces that the
// caller is the class owner or a member — no cross-class leakage is possible.
// ---------------------------------------------------------------------------

export type StudentRow = {
  id: string;
  class_id: string;
  name: string;
  roll: string;
  email: string | null;
  user_id: string | null;
  created_at: string;
};

export type AssessmentRow = {
  id: string;
  class_id: string;
  name: string;
  kind: string;
  max_marks: number;
  assessment_date: string | null;
  description: string | null;
  sort_order: number;
};

export type MarkRow = {
  id: string;
  class_id: string;
  assessment_id: string;
  student_id: string;
  score: number | null;
};

export type SessionRow = {
  id: string;
  class_id: string;
  session_date: string;
  title: string | null;
};

export type AttendanceRecordRow = {
  id: string;
  class_id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "late";
};

export type NoticeRow = {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  body: string | null;
  attachment_path: string | null;
  created_at: string;
};

export type ResourceRow = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  file_path: string;
  created_at: string;
};

export type CommentRow = {
  id: string;
  class_id: string;
  notice_id: string | null;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

export function useStudents(classId: string | undefined) {
  return useQuery({
    queryKey: ["students", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId!)
        .order("roll");
      if (error) throw error;
      return (data ?? []) as unknown as StudentRow[];
    },
  });
}

export function useAssessments(classId: string | undefined) {
  return useQuery({
    queryKey: ["assessments", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("class_id", classId!)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as AssessmentRow[];
    },
  });
}

export function useMarks(classId: string | undefined) {
  return useQuery({
    queryKey: ["marks", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase.from("marks").select("*").eq("class_id", classId!);
      if (error) throw error;
      return (data ?? []) as unknown as MarkRow[];
    },
  });
}

export function useAttendance(classId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", classId],
    enabled: !!classId,
    queryFn: async () => {
      const [sessions, records] = await Promise.all([
        supabase
          .from("attendance_sessions")
          .select("*")
          .eq("class_id", classId!)
          .order("session_date", { ascending: false }),
        supabase.from("attendance_records").select("*").eq("class_id", classId!),
      ]);
      if (sessions.error) throw sessions.error;
      if (records.error) throw records.error;
      return {
        sessions: (sessions.data ?? []) as unknown as SessionRow[],
        records: (records.data ?? []) as unknown as AttendanceRecordRow[],
      };
    },
  });
}

export function useNotices(classId: string | undefined) {
  return useQuery({
    queryKey: ["notices", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("class_id", classId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NoticeRow[];
    },
  });
}

export function useResources(classId: string | undefined) {
  return useQuery({
    queryKey: ["resources", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("class_id", classId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ResourceRow[];
    },
  });
}

export function useComments(classId: string | undefined) {
  return useQuery({
    queryKey: ["comments", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("class_id", classId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });
}

/** The student row linked to the signed-in user inside this class (if any). */
export function useMyStudentId(classId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["my-student-id", classId],
    enabled: !!classId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_student_id", { _class: classId! });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
  });
}

export function useOwnerName(ownerId: string | undefined, classId?: string) {
  return useQuery({
    queryKey: ["owner-name", classId ?? ownerId],
    enabled: !!(classId || ownerId),
    queryFn: async () => {
      if (classId) {
        const { data: rpcName, error: rpcErr } = await supabase.rpc("get_class_faculty_name", {
          _class: classId,
        });
        if (!rpcErr && rpcName) return rpcName;
      }
      if (!ownerId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", ownerId)
        .maybeSingle();
      const row = data as { full_name: string | null; email: string | null } | null;
      return row?.full_name ?? row?.email ?? null;
    },
  });
}

export function attendanceByStudent(
  sessions: SessionRow[],
  records: AttendanceRecordRow[],
): Record<
  string,
  { total: number; present: number; late: number; absent: number; percentage: number }
> {
  const total = sessions.length;
  const out: Record<
    string,
    { total: number; present: number; late: number; absent: number; percentage: number }
  > = {};
  for (const r of records) {
    const bucket = (out[r.student_id] ??= { total, present: 0, late: 0, absent: 0, percentage: 0 });
    if (r.status === "present") bucket.present += 1;
    else if (r.status === "late") bucket.late += 1;
    else bucket.absent += 1;
  }
  for (const key of Object.keys(out)) {
    const b = out[key]!;
    b.total = total;
    b.percentage = total ? ((b.present + b.late * 0.5) / total) * 100 : 0;
  }
  return out;
}
