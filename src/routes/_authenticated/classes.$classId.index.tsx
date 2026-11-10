import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  attendanceByStudent,
  useAssessments,
  useAttendance,
  useClass,
  useNotices,
  useStudents,
} from "@/lib/data";
import {
  EmptyState,
  LedgerButton,
  Panel,
  PanelHeader,
  TextArea,
  TextField,
} from "@/components/ledger";
import { fmt } from "@/lib/grading";

export const Route = createFileRoute("/_authenticated/classes/$classId/")({
  head: () => ({
    meta: [
      { title: "Class overview — Registrar" },
      {
        name: "description",
        content: "Class details, roster size, assessments and recent activity.",
      },
      { property: "og:title", content: "Class overview — Registrar" },
      { property: "og:description", content: "Class details, roster size and recent activity." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: assessments } = useAssessments(classId);
  const { data: attendance } = useAttendance(classId);
  const { data: notices } = useNotices(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    department: "",
    subject: "",
    section: "",
    semester: "",
    academic_year: "",
    room: "",
    schedule: "",
    description: "",
  });

  function startEdit() {
    if (!cls) return;
    setForm({
      department: cls.department,
      subject: cls.subject,
      section: cls.section,
      semester: cls.semester,
      academic_year: cls.academic_year,
      room: cls.room ?? "",
      schedule: cls.schedule ?? "",
      description: cls.description ?? "",
    });
    setEditing(true);
  }

  async function saveClassInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    const required = ["department", "subject", "section", "semester", "academic_year"] as const;
    for (const key of required) {
      if (!form[key].trim()) {
        toast.error("Please fill in every required field.");
        return;
      }
    }
    setBusy(true);
    const { error } = await supabase
      .from("classes")
      .update({
        department: form.department.trim(),
        subject: form.subject.trim(),
        section: form.section.trim(),
        semester: form.semester.trim(),
        academic_year: form.academic_year.trim(),
        room: form.room.trim() || null,
        schedule: form.schedule.trim() || null,
        description: form.description.trim() || null,
      })
      .eq("id", classId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class details updated");
    setEditing(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["class", classId] }),
      queryClient.invalidateQueries({ queryKey: ["my-classes"] }),
    ]);
  }

  const stats = attendanceByStudent(attendance?.sessions ?? [], attendance?.records ?? []);
  const studentList = students ?? [];
  const sessionsCount = attendance?.sessions.length ?? 0;
  const avgAttendance =
    studentList.length > 0 && sessionsCount > 0
      ? studentList.reduce((acc, s) => acc + (stats[s.id]?.percentage ?? 0), 0) / studentList.length
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Students", value: students?.length ?? 0 },
          { label: "Assessments", value: assessments?.length ?? 0 },
          { label: "Attendance sessions", value: sessionsCount },
          { label: "Average attendance", value: `${fmt(avgAttendance)}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-card p-4 ring-1 ring-black/5">
            <p className="label-caps">{s.label}</p>
            <p className="num mt-1.5 text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader
            title="Class information"
            actions={
              isOwner && !editing ? (
                <LedgerButton onClick={startEdit}>Edit class</LedgerButton>
              ) : null
            }
          />
          {editing && isOwner ? (
            <form onSubmit={saveClassInfo} className="grid gap-3 p-5 sm:grid-cols-2">
              <TextField
                label="Department"
                required
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
              <TextField
                label="Subject"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
              <TextField
                label="Section"
                required
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
              />
              <TextField
                label="Semester"
                required
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              />
              <TextField
                label="Academic year"
                required
                value={form.academic_year}
                onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
              />
              <TextField
                label="Room"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              />
              <TextField
                label="Schedule"
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                className="sm:col-span-2"
              />
              <TextArea
                label="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="sm:col-span-2"
              />
              <div className="flex gap-2 border-t border-border pt-3 sm:col-span-2">
                <LedgerButton type="submit" variant="solid" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </LedgerButton>
                <LedgerButton type="button" onClick={() => setEditing(false)}>
                  Cancel
                </LedgerButton>
              </div>
            </form>
          ) : (
            <dl className="grid gap-3 p-5 sm:grid-cols-2">
              {[
                ["Department", cls?.department],
                ["Subject", cls?.subject],
                ["Section", cls?.section],
                ["Semester", cls?.semester],
                ["Academic year", cls?.academic_year],
                ["Room", cls?.room ?? "—"],
                ["Schedule", cls?.schedule ?? "—"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="label-caps">{label}</dt>
                  <dd className="mt-0.5 text-sm">{value || "—"}</dd>
                </div>
              ))}
              {cls?.description ? (
                <div className="sm:col-span-2">
                  <dt className="label-caps">Description</dt>
                  <dd className="mt-0.5 text-sm text-inksoft">{cls.description}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent notices"
            actions={
              <Link to="/classes/$classId/notices" params={{ classId }}>
                <LedgerButton>All notices</LedgerButton>
              </Link>
            }
          />
          {(notices ?? []).length === 0 ? (
            <EmptyState
              title="No notices yet"
              description={
                isOwner
                  ? "Post a notice to tell this class about classes, exams or deadlines."
                  : "Your faculty hasn't posted anything yet."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {(notices ?? []).slice(0, 5).map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[13px] text-mute">{n.body}</p>
                      ) : null}
                    </div>
                    <span className="num shrink-0 text-[11px] text-mute">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Quick actions"
          hint={isOwner ? "Faculty tools" : "Read-only class view"}
        />
        <div className="flex flex-wrap gap-2 p-4">
          {(isOwner
            ? ([
                ["/classes/$classId/students", "Manage students"],
                ["/classes/$classId/attendance", "Take attendance"],
                ["/classes/$classId/assessments", "Create assessment"],
                ["/classes/$classId/marks", "Enter marks"],
                ["/classes/$classId/reports", "Generate report"],
              ] as const)
            : ([
                ["/classes/$classId/students", "Students"],
                ["/classes/$classId/attendance", "Attendance"],
                ["/classes/$classId/marks", "Marks"],
                ["/classes/$classId/results", "Results"],
                ["/classes/$classId/resources", "Resources"],
                ["/classes/$classId/discussion", "Discussion"],
              ] as const)
          ).map(([to, label]) => (
            <Link key={to} to={to} params={{ classId }}>
              <LedgerButton>{label}</LedgerButton>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
