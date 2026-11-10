import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  attendanceByStudent,
  useAssessments,
  useAttendance,
  useClass,
  useMarks,
  useMyStudentId,
  useStudents,
  type StudentRow,
} from "@/lib/data";
import { computeResult, emptyAttendance, fmt } from "@/lib/grading";
import { scanStudentList, type ScannedStudent } from "@/lib/ocr.functions";
import {
  ConfirmButton,
  EmptyState,
  GradeBadge,
  LedgerButton,
  Loading,
  Meter,
  Panel,
  PanelHeader,
  SearchInput,
  TextField,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/students")({
  head: () => ({
    meta: [
      { title: "Class students — Registrar" },
      {
        name: "description",
        content: "The roster of this class with attendance, marks and grades.",
      },
      { property: "og:title", content: "Class students — Registrar" },
      {
        property: "og:description",
        content: "The roster of this class with attendance and grades.",
      },
    ],
  }),
  component: StudentsPage,
});

type DraftRow = { name: string; roll: string };

function StudentsPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students, isLoading } = useStudents(classId);
  const { data: assessments } = useAssessments(classId);
  const { data: marks } = useMarks(classId);
  const { data: attendance } = useAttendance(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;
  const { data: myStudentId } = useMyStudentId(classId, !isOwner);

  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", roll: "", email: "" });
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [scanBusy, setScanBusy] = useState(false);
  const [draft, setDraft] = useState<DraftRow[] | null>(null);

  const attStats = attendanceByStudent(attendance?.sessions ?? [], attendance?.records ?? []);
  const scoresByStudent = useMemo(() => {
    const map: Record<string, Record<string, number | null>> = {};
    for (const m of marks ?? []) {
      (map[m.student_id] ??= {})[m.assessment_id] = m.score;
    }
    return map;
  }, [marks]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (students ?? [])
      .filter((s) => `${s.name} ${s.roll} ${s.email ?? ""}`.toLowerCase().includes(needle))
      .map((s) => {
        const result = computeResult({
          assessments: assessments ?? [],
          scores: scoresByStudent[s.id] ?? {},
          attendance: attStats[s.id] ?? emptyAttendance(attendance?.sessions.length ?? 0),
          weights: cls?.weights ?? {},
          scale: cls?.grading_scale ?? [],
        });
        return { student: s, result };
      });
  }, [students, q, assessments, scoresByStudent, attStats, cls, attendance?.sessions.length]);

  async function saveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    if (!form.name.trim() || !form.roll.trim()) {
      toast.error("Name and ID / roll are both required.");
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      roll: form.roll.trim(),
      email: form.email.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("students").update(payload).eq("id", editing.id)
      : await supabase.from("students").insert({ class_id: classId, ...payload });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("students_class_id_roll_key")
          ? "A student with that ID already exists in this class."
          : error.message,
      );
      return;
    }
    toast.success(editing ? "Student updated" : "Student added");
    setForm({ name: "", roll: "", email: "" });
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["students", classId] });
  }

  async function removeStudent(id: string) {
    if (!isOwner) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Student removed from this class");
    await queryClient.invalidateQueries({ queryKey: ["students", classId] });
  }

  async function onScanFile(file: File) {
    if (!isOwner) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please use a file under 8 MB.");
      return;
    }
    setScanBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });
      const mimeType =
        file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const result = await scanStudentList({ data: { dataUrl, mimeType } });
      const found = (result.students as ScannedStudent[]) ?? [];
      if (!found.length) {
        toast.error("No student rows were found. Try a sharper, straighter photo.");
      } else {
        toast.success(`${found.length} rows read — check them before importing.`);
      }
      setDraft(found.length ? found : [{ name: "", roll: "" }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scanning failed");
    } finally {
      setScanBusy(false);
    }
  }

  async function importDraft() {
    if (!isOwner || !draft) return;
    const clean = draft
      .map((r) => ({ name: r.name.trim(), roll: r.roll.trim() }))
      .filter((r) => r.name && r.roll);
    if (!clean.length) {
      toast.error("Every row needs a name and an ID.");
      return;
    }
    const seen = new Set<string>();
    const unique = clean.filter((r) => (seen.has(r.roll) ? false : (seen.add(r.roll), true)));
    setBusy(true);
    const { error } = await supabase.from("students").upsert(
      unique.map((r) => ({ class_id: classId, name: r.name, roll: r.roll })),
      { onConflict: "class_id,roll" },
    );
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${unique.length} students imported into this class`);
    setDraft(null);
    await queryClient.invalidateQueries({ queryKey: ["students", classId] });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Students"
          hint={`${rows.length} of ${students?.length ?? 0}${!isOwner ? " · Read only" : ""}`}
          actions={
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search name or ID"
              className="w-56"
            />
          }
        />
        {isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No students in this class"
            description={
              isOwner
                ? "Add students one by one, or scan a printed list below. They belong to this class only."
                : "The roster hasn't been added yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps px-4 py-2 font-normal">Student</th>
                  <th className="label-caps px-3 py-2 font-normal">ID / Roll</th>
                  <th className="label-caps px-3 py-2 font-normal">Email</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Attendance</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Marks</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">%</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Grade</th>
                  {isOwner ? <th className="px-3 py-2" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ student, result }) => (
                  <tr key={student.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        {student.name}
                        {!isOwner && student.id === myStudentId ? (
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-inksoft">
                            You
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="num px-3 py-2">{student.roll}</td>
                    <td className="px-3 py-2 text-[13px] text-mute">{student.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <span className="num">{fmt(result.attendance.percentage)}%</span>
                        <div className="w-16">
                          <Meter value={result.attendance.percentage} />
                        </div>
                      </div>
                    </td>
                    <td className="num px-3 py-2 text-right">
                      {result.rawTotal} / {result.rawMax}
                    </td>
                    <td className="num px-3 py-2 text-right">{fmt(result.percentage)}</td>
                    <td className="px-3 py-2 text-right">
                      <GradeBadge grade={result.grade} />
                    </td>
                    {isOwner ? (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <LedgerButton
                            onClick={() => {
                              setEditing(student);
                              setForm({
                                name: student.name,
                                roll: student.roll,
                                email: student.email ?? "",
                              });
                            }}
                          >
                            Edit
                          </LedgerButton>
                          <ConfirmButton
                            label="Remove"
                            message={`Remove ${student.name} from this class? Their attendance and marks in this class will be deleted.`}
                            onConfirm={() => void removeStudent(student.id)}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {isOwner ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="h-fit">
            <PanelHeader title={editing ? "Edit student" : "Add a student"} />
            <form onSubmit={saveStudent} className="grid gap-4 p-4 sm:grid-cols-2">
              <TextField
                label="Full name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextField
                label="ID / Roll"
                required
                value={form.roll}
                onChange={(e) => setForm((f) => ({ ...f, roll: e.target.value }))}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                hint="Used to link the student's account to this roster row."
                className="sm:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2">
                <LedgerButton type="submit" variant="solid" disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save changes" : "Add student"}
                </LedgerButton>
                {editing ? (
                  <LedgerButton
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ name: "", roll: "", email: "" });
                    }}
                  >
                    Cancel
                  </LedgerButton>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel className="h-fit">
            <PanelHeader title="Scan a printed list" hint="Photo, scan or screenshot" />
            <div className="space-y-3 p-4">
              <p className="text-[13px] text-mute">
                Upload a picture of your physical student list. Names and IDs are read for you — you
                check and correct every row before anything is imported into this class.
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                disabled={scanBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onScanFile(file);
                  e.target.value = "";
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-[12px]"
              />
              {scanBusy ? <p className="text-[13px] text-mute">Reading the list…</p> : null}
            </div>
          </Panel>
        </div>
      ) : null}

      {draft ? (
        <Panel>
          <PanelHeader
            title="Verify before importing"
            hint="Correct anything misread, delete wrong rows, add missing ones"
            actions={
              <>
                <LedgerButton onClick={() => setDraft([...draft, { name: "", roll: "" }])}>
                  Add row
                </LedgerButton>
                <LedgerButton variant="solid" disabled={busy} onClick={() => void importDraft()}>
                  {busy ? "Importing…" : `Import ${draft.length} rows`}
                </LedgerButton>
                <LedgerButton onClick={() => setDraft(null)}>Discard</LedgerButton>
              </>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps px-4 py-2 font-normal">#</th>
                  <th className="label-caps px-3 py-2 font-normal">Name</th>
                  <th className="label-caps px-3 py-2 font-normal">ID / Roll</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draft.map((row, index) => (
                  <tr key={index}>
                    <td className="num px-4 py-1.5 text-mute">{index + 1}</td>
                    <td className="px-3 py-1.5">
                      <input
                        value={row.name}
                        onChange={(e) =>
                          setDraft(
                            draft.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                          )
                        }
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={row.roll}
                        onChange={(e) =>
                          setDraft(
                            draft.map((r, i) => (i === index ? { ...r, roll: e.target.value } : r)),
                          )
                        }
                        className="num w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <LedgerButton onClick={() => setDraft(draft.filter((_, i) => i !== index))}>
                        Delete
                      </LedgerButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
