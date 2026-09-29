import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  attendanceByStudent,
  notifyClass,
  useAttendance,
  useClass,
  useMyStudentId,
  useStudents,
} from "@/lib/data";
import { fmt } from "@/lib/grading";
import { downloadCsv, downloadPdf } from "@/lib/exports";
import {
  ConfirmButton,
  EmptyState,
  LedgerButton,
  Loading,
  Meter,
  Panel,
  PanelHeader,
  SearchInput,
  StatusPill,
  TextField,
} from "@/components/ledger";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/classes/$classId/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Registrar" },
      { name: "description", content: "Attendance sessions, present / late / absent records and percentages." },
      { property: "og:title", content: "Attendance — Registrar" },
      { property: "og:description", content: "Attendance sessions and percentages for this class." },
    ],
  }),
  component: AttendancePage,
});

type Status = "present" | "absent" | "late";

function AttendancePage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: attendance, isLoading } = useAttendance(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;
  const { data: myStudentId } = useMyStudentId(classId, !isOwner);

  const [q, setQ] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionTitle, setSessionTitle] = useState("");
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);

  const sessions = attendance?.sessions ?? [];
  const records = attendance?.records ?? [];
  const stats = attendanceByStudent(sessions, records);

  const visibleStudents = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (students ?? [])
      .filter((s) => (isOwner ? true : s.id === myStudentId))
      .filter((s) => `${s.name} ${s.roll}`.toLowerCase().includes(needle));
  }, [students, q, isOwner, myStudentId]);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionDate) {
      toast.error("Pick a date for the session.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({ class_id: classId, session_date: sessionDate, title: sessionTitle.trim() || null })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSessionTitle("");
    setOpenSession(data.id);
    setDraft(Object.fromEntries((students ?? []).map((s) => [s.id, "absent" as Status])));
    await queryClient.invalidateQueries({ queryKey: ["attendance", classId] });
  }

  function loadSession(sessionId: string) {
    setOpenSession(sessionId);
    const existing: Record<string, Status> = {};
    for (const r of records.filter((r) => r.session_id === sessionId)) existing[r.student_id] = r.status;
    for (const s of students ?? []) existing[s.id] ??= "absent";
    setDraft(existing);
  }

  async function saveSession() {
    if (!openSession) return;
    setBusy(true);
    const rows = (students ?? []).map((s) => ({
      class_id: classId,
      session_id: openSession,
      student_id: s.id,
      status: draft[s.id] ?? "absent",
    }));
    const { error } = await supabase
      .from("attendance_records")
      .upsert(rows, { onConflict: "session_id,student_id" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await notifyClass({
      classId,
      actorId: user!.id,
      kind: "attendance",
      title: "Attendance updated",
      body: `${cls?.subject ?? "Class"}: attendance saved for ${
        sessions.find((s) => s.id === openSession)?.session_date ?? "a session"
      }`,
    });
    toast.success("Attendance saved");
    setOpenSession(null);
    await queryClient.invalidateQueries({ queryKey: ["attendance", classId] });
  }

  async function deleteSession(id: string) {
    const { error } = await supabase.from("attendance_sessions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session deleted");
    if (openSession === id) setOpenSession(null);
    await queryClient.invalidateQueries({ queryKey: ["attendance", classId] });
  }

  const exportColumns = ["Student", "ID / Roll", "Total classes", "Present", "Late", "Absent", "Percentage"];
  const exportRows = visibleStudents.map((s) => {
    const st = stats[s.id];
    return [
      s.name,
      s.roll,
      sessions.length,
      st?.present ?? 0,
      st?.late ?? 0,
      st?.absent ?? Math.max(0, sessions.length - (st?.present ?? 0) - (st?.late ?? 0)),
      `${fmt(st?.percentage ?? 0)}%`,
    ];
  });

  return (
    <div className="space-y-4">
      {isOwner ? (
        <Panel>
          <PanelHeader title="New attendance session" hint="One session per class meeting" />
          <form onSubmit={createSession} className="flex flex-wrap items-end gap-3 p-4">
            <TextField
              label="Date"
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-44"
            />
            <TextField
              label="Title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Lecture 7 (optional)"
              className="w-60"
            />
            <LedgerButton type="submit" variant="solid" disabled={busy}>
              {busy ? "Creating…" : "Create session"}
            </LedgerButton>
          </form>
        </Panel>
      ) : null}

      {isOwner && openSession ? (
        <Panel>
          <PanelHeader
            title={`Mark attendance — ${sessions.find((s) => s.id === openSession)?.session_date ?? ""}`}
            hint="Present, Late or Absent for each student"
            actions={
              <>
                <LedgerButton variant="solid" disabled={busy} onClick={() => void saveSession()}>
                  {busy ? "Saving…" : "Save attendance"}
                </LedgerButton>
                <LedgerButton onClick={() => setOpenSession(null)}>Close</LedgerButton>
              </>
            }
          />
          {(students ?? []).length === 0 ? (
            <EmptyState title="No students yet" description="Add students before taking attendance." />
          ) : (
            <ul className="divide-y divide-border">
              {(students ?? []).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="num text-[11px] text-mute">{s.roll}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {(["present", "late", "absent"] as Status[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setDraft((d) => ({ ...d, [s.id]: status }))}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-medium capitalize ring-1 transition-colors",
                          (draft[s.id] ?? "absent") === status
                            ? "bg-ink text-paper ring-ink"
                            : "bg-card text-inksoft ring-border hover:bg-secondary",
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Attendance analysis"
          hint={isOwner ? `${sessions.length} sessions` : "Your record in this class"}
          actions={
            <>
              <SearchInput value={q} onChange={setQ} placeholder="Search student" className="w-48" />
              <LedgerButton
                onClick={() =>
                  downloadCsv(`attendance-${cls?.subject ?? "class"}.csv`, exportColumns, exportRows)
                }
              >
                CSV
              </LedgerButton>
              <LedgerButton
                onClick={() =>
                  downloadPdf(
                    `attendance-${cls?.subject ?? "class"}.pdf`,
                    {
                      heading: cls?.department ?? "Department",
                      subheading: `Attendance Report — ${cls?.subject ?? ""}`,
                      lines: [
                        `Section: ${cls?.section ?? ""}    Semester: ${cls?.semester ?? ""}    Academic year: ${cls?.academic_year ?? ""}`,
                        `Total sessions: ${sessions.length}`,
                      ],
                    },
                    exportColumns,
                    exportRows,
                  )
                }
              >
                PDF
              </LedgerButton>
            </>
          }
        />
        {isLoading ? (
          <Loading />
        ) : visibleStudents.length === 0 ? (
          <EmptyState title="Nothing to show" description="No attendance records for this class yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps px-4 py-2 font-normal">Student</th>
                  <th className="label-caps px-3 py-2 font-normal">ID / Roll</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Total</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Present</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Late</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Absent</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleStudents.map((s) => {
                  const st = stats[s.id];
                  const absent =
                    st?.absent ?? Math.max(0, sessions.length - (st?.present ?? 0) - (st?.late ?? 0));
                  return (
                    <tr key={s.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="num px-3 py-2">{s.roll}</td>
                      <td className="num px-3 py-2 text-right">{sessions.length}</td>
                      <td className="num px-3 py-2 text-right">{st?.present ?? 0}</td>
                      <td className="num px-3 py-2 text-right">{st?.late ?? 0}</td>
                      <td className="num px-3 py-2 text-right">{absent}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="num">{fmt(st?.percentage ?? 0)}%</span>
                          <div className="w-20">
                            <Meter value={st?.percentage ?? 0} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Sessions" hint={`${sessions.length} recorded`} />
        {sessions.length === 0 ? (
          <EmptyState title="No sessions yet" description="Attendance sessions you create appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => {
              const marked = records.filter((r) => r.session_id === s.id);
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="num text-sm font-medium">{s.session_date}</p>
                    <p className="text-[11px] text-mute">
                      {s.title ?? "Class session"} · {marked.length} marked
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["present", "late", "absent"] as Status[]).map((status) => (
                      <span key={status} className="flex items-center gap-1">
                        <StatusPill status={status} />
                        <span className="num text-[11px] text-mute">
                          {marked.filter((r) => r.status === status).length}
                        </span>
                      </span>
                    ))}
                    {isOwner ? (
                      <>
                        <LedgerButton onClick={() => loadSession(s.id)}>Edit</LedgerButton>
                        <ConfirmButton
                          label="Delete"
                          message={`Delete the session of ${s.session_date}? Only this session's records are removed.`}
                          onConfirm={() => void deleteSession(s.id)}
                        />
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
