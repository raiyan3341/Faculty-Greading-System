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
} from "@/lib/data";
import { computeResult, emptyAttendance, fmt } from "@/lib/grading";
import {
  EmptyState,
  GradeBadge,
  LedgerButton,
  Loading,
  Panel,
  PanelHeader,
  SearchInput,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/results")({
  head: () => ({
    meta: [
      { title: "Results — Registrar" },
      {
        name: "description",
        content: "Weighted totals, percentages and letter grades for this class.",
      },
      { property: "og:title", content: "Results — Registrar" },
      { property: "og:description", content: "Weighted totals, percentages and letter grades." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: assessments } = useAssessments(classId);
  const { data: marks, isLoading } = useMarks(classId);
  const { data: attendance } = useAttendance(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;
  const { data: myStudentId } = useMyStudentId(classId, !isOwner);

  const [q, setQ] = useState("");
  const [weightDraft, setWeightDraft] = useState<Record<string, string> | null>(null);
  const [scaleDraft, setScaleDraft] = useState<{ grade: string; min: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = attendanceByStudent(attendance?.sessions ?? [], attendance?.records ?? []);
  const scoresByStudent = useMemo(() => {
    const map: Record<string, Record<string, number | null>> = {};
    for (const m of marks ?? []) (map[m.student_id] ??= {})[m.assessment_id] = m.score;
    return map;
  }, [marks]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (students ?? [])
      .filter((s) => (isOwner ? true : s.id === myStudentId))
      .filter((s) => `${s.name} ${s.roll}`.toLowerCase().includes(needle))
      .map((s) => ({
        student: s,
        result: computeResult({
          assessments: assessments ?? [],
          scores: scoresByStudent[s.id] ?? {},
          attendance: stats[s.id] ?? emptyAttendance(attendance?.sessions.length ?? 0),
          weights: cls?.weights ?? {},
          scale: cls?.grading_scale ?? [],
        }),
      }));
  }, [
    students,
    q,
    isOwner,
    myStudentId,
    assessments,
    scoresByStudent,
    stats,
    cls,
    attendance?.sessions.length,
  ]);

  async function saveWeights() {
    if (!weightDraft) return;
    const weights: Record<string, number> = {};
    for (const [kind, value] of Object.entries(weightDraft)) {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) {
        toast.error(`"${value}" is not a valid weight.`);
        return;
      }
      weights[kind] = n;
    }
    setBusy(true);
    const { error } = await supabase.from("classes").update({ weights }).eq("id", classId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Weights saved — grades recalculated");
    setWeightDraft(null);
    await queryClient.invalidateQueries({ queryKey: ["class", classId] });
  }

  async function saveScale() {
    if (!scaleDraft) return;
    const scale: { grade: string; min: number }[] = [];
    for (const row of scaleDraft) {
      const grade = row.grade.trim();
      const min = Number(row.min);
      if (!grade) {
        toast.error("Every grade needs a name, e.g. A+.");
        return;
      }
      if (!Number.isFinite(min) || min < 0 || min > 100) {
        toast.error(`"${row.min}" is not a valid percentage (0–100).`);
        return;
      }
      scale.push({ grade, min });
    }
    setBusy(true);
    const { error } = await supabase
      .from("classes")
      .update({ grading_scale: scale })
      .eq("id", classId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Grade scale saved — grades recalculated");
    setScaleDraft(null);
    await queryClient.invalidateQueries({ queryKey: ["class", classId] });
  }

  const weightEntries = Object.entries(cls?.weights ?? {});

  return (
    <div className="space-y-4">
      {isOwner ? (
        <Panel>
          <PanelHeader
            title="Grading weights"
            hint="Weighted marks → total → percentage → letter grade"
            actions={
              weightDraft ? (
                <>
                  <LedgerButton variant="solid" disabled={busy} onClick={() => void saveWeights()}>
                    {busy ? "Saving…" : "Save weights"}
                  </LedgerButton>
                  <LedgerButton onClick={() => setWeightDraft(null)}>Cancel</LedgerButton>
                </>
              ) : (
                <LedgerButton
                  onClick={() =>
                    setWeightDraft(
                      Object.fromEntries(weightEntries.map(([k, v]) => [k, String(v)])),
                    )
                  }
                >
                  Edit weights
                </LedgerButton>
              )
            }
          />
          <div className="flex flex-wrap gap-3 p-4">
            {(weightDraft ? Object.entries(weightDraft) : weightEntries).map(([kind, value]) => (
              <div key={kind} className="rounded-md bg-secondary/50 px-3 py-2">
                <p className="label-caps">{kind}</p>
                {weightDraft ? (
                  <input
                    value={String(value)}
                    inputMode="decimal"
                    onChange={(e) => setWeightDraft({ ...weightDraft, [kind]: e.target.value })}
                    className="num mt-1 w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm"
                  />
                ) : (
                  <p className="num mt-0.5 text-lg">{String(value)}%</p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            {scaleDraft ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {scaleDraft.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5"
                    >
                      <input
                        value={row.grade}
                        onChange={(e) =>
                          setScaleDraft(
                            scaleDraft.map((r, j) =>
                              j === i ? { ...r, grade: e.target.value } : r,
                            ),
                          )
                        }
                        className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-center text-sm font-medium"
                      />
                      <span className="text-[12px] text-mute">≥</span>
                      <input
                        value={row.min}
                        inputMode="numeric"
                        onChange={(e) =>
                          setScaleDraft(
                            scaleDraft.map((r, j) => (j === i ? { ...r, min: e.target.value } : r)),
                          )
                        }
                        className="num w-12 rounded border border-border bg-background px-1.5 py-0.5 text-right text-sm"
                      />
                      <span className="text-[12px] text-mute">%</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <LedgerButton variant="solid" disabled={busy} onClick={() => void saveScale()}>
                    {busy ? "Saving…" : "Save scale"}
                  </LedgerButton>
                  <LedgerButton onClick={() => setScaleDraft(null)}>Cancel</LedgerButton>
                  <span className="text-[12px] text-mute">
                    Highest percentage wins — keep the lowest grade at 0.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] text-mute">
                  Grade scale:{" "}
                  {(cls?.grading_scale ?? [])
                    .slice()
                    .sort((a, b) => b.min - a.min)
                    .map((s) => `${s.grade} ≥ ${s.min}`)
                    .join(" · ")}
                </p>
                <LedgerButton
                  onClick={() =>
                    setScaleDraft(
                      (cls?.grading_scale ?? [])
                        .slice()
                        .sort((a, b) => b.min - a.min)
                        .map((s) => ({ grade: s.grade, min: String(s.min) })),
                    )
                  }
                >
                  Edit scale
                </LedgerButton>
              </div>
            )}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title={isOwner ? "Class marksheet" : "Your result"}
          hint={`${rows.length} student${rows.length === 1 ? "" : "s"}`}
          actions={
            isOwner ? (
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Search student"
                className="w-48"
              />
            ) : null
          }
        />
        {isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing to show yet"
            description={
              isOwner
                ? "Add students, assessments and marks to see the full marksheet."
                : "Your faculty hasn't published marks for you in this class yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps sticky left-0 bg-secondary px-4 py-2 font-normal">
                    Student
                  </th>
                  <th className="label-caps px-3 py-2 font-normal">ID</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Attend.</th>
                  {(assessments ?? []).map((a) => (
                    <th key={a.id} className="px-3 py-2 text-right font-normal">
                      <span className="label-caps block">{a.kind}</span>
                      <span className="text-[12px] font-medium text-foreground">{a.name}</span>
                      <span className="num block text-[11px] text-mute">/ {a.max_marks}</span>
                    </th>
                  ))}
                  <th className="label-caps px-3 py-2 text-right font-normal">Total</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">%</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ student, result }) => (
                  <tr key={student.id} className="hover:bg-secondary/30">
                    <td className="sticky left-0 bg-card px-4 py-2 font-medium">{student.name}</td>
                    <td className="num px-3 py-2">{student.roll}</td>
                    <td className="num px-3 py-2 text-right">
                      {fmt(result.attendance.percentage)}%
                    </td>
                    {(assessments ?? []).map((a) => {
                      const score = scoresByStudent[student.id]?.[a.id];
                      return (
                        <td key={a.id} className="num px-3 py-2 text-right">
                          {score === null || score === undefined ? "—" : score}
                        </td>
                      );
                    })}
                    <td className="num px-3 py-2 text-right">
                      {result.rawTotal} / {result.rawMax}
                    </td>
                    <td className="num px-3 py-2 text-right font-medium">
                      {fmt(result.percentage)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <GradeBadge grade={result.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {!isOwner && rows[0] ? (
        <Panel>
          <PanelHeader title="How your grade was calculated" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps px-4 py-2 font-normal">Component</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Obtained</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Weight</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Weighted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows[0].result.components.map((c) => (
                  <tr key={c.kind}>
                    <td className="px-4 py-2">{c.kind}</td>
                    <td className="num px-3 py-2 text-right">
                      {fmt(c.obtained)} / {c.max}
                    </td>
                    <td className="num px-3 py-2 text-right">{c.weight}%</td>
                    <td className="num px-3 py-2 text-right">{fmt(c.weighted)}</td>
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
