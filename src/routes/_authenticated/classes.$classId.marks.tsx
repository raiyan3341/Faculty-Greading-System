import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  notifyClass,
  useAssessments,
  useClass,
  useMarks,
  useMyStudentId,
  useStudents,
} from "@/lib/data";
import {
  EmptyState,
  LedgerButton,
  Loading,
  Panel,
  PanelHeader,
  SearchInput,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/marks")({
  head: () => ({
    meta: [
      { title: "Marks entry — Registrar" },
      {
        name: "description",
        content: "Spreadsheet-style marks entry for every assessment in this class.",
      },
      { property: "og:title", content: "Marks entry — Registrar" },
      { property: "og:description", content: "Spreadsheet-style marks entry for this class." },
    ],
  }),
  component: MarksPage,
});

function MarksPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: assessments } = useAssessments(classId);
  const { data: marks, isLoading } = useMarks(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;
  const { data: myStudentId } = useMyStudentId(classId, !isOwner);

  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const saved = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const m of marks ?? []) map[`${m.student_id}:${m.assessment_id}`] = m.score;
    return map;
  }, [marks]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (students ?? []).filter((s) => `${s.name} ${s.roll}`.toLowerCase().includes(needle));
  }, [students, q]);

  const dirtyCount = Object.keys(edits).length;

  async function saveAll() {
    if (!isOwner) return;
    const payload: {
      class_id: string;
      student_id: string;
      assessment_id: string;
      score: number | null;
    }[] = [];
    for (const [key, raw] of Object.entries(edits)) {
      const [studentId, assessmentId] = key.split(":") as [string, string];
      const assessment = (assessments ?? []).find((a) => a.id === assessmentId);
      if (!assessment) continue;
      if (raw.trim() === "") {
        payload.push({
          class_id: classId,
          student_id: studentId,
          assessment_id: assessmentId,
          score: null,
        });
        continue;
      }
      const score = Number(raw);
      if (!Number.isFinite(score) || score < 0) {
        toast.error(`"${raw}" is not a valid mark.`);
        return;
      }
      if (score > Number(assessment.max_marks)) {
        toast.error(`${assessment.name}: a mark cannot exceed ${assessment.max_marks}.`);
        return;
      }
      payload.push({
        class_id: classId,
        student_id: studentId,
        assessment_id: assessmentId,
        score,
      });
    }
    if (!payload.length) return;
    setBusy(true);
    const { error } = await supabase
      .from("marks")
      .upsert(payload, { onConflict: "assessment_id,student_id" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await notifyClass({
      classId,
      actorId: user!.id,
      kind: "marks",
      title: "Marks updated",
      body: `${cls?.subject ?? "Class"}: marks were entered or changed`,
    });
    setEdits({});
    toast.success(`${payload.length} marks saved`);
    await queryClient.invalidateQueries({ queryKey: ["marks", classId] });
  }

  if (isLoading) {
    return (
      <Panel>
        <Loading />
      </Panel>
    );
  }

  if ((assessments ?? []).length === 0 || (students ?? []).length === 0) {
    return (
      <Panel>
        <PanelHeader title="Marks" />
        <EmptyState
          title="Not ready for marks yet"
          description="Add students and at least one assessment first — then this becomes a spreadsheet you can type into."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Marks entry"
        hint={
          isOwner ? "A mark can never exceed its assessment maximum" : "All class marks · Read only"
        }
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search student" className="w-48" />
            {isOwner ? (
              <>
                {dirtyCount ? (
                  <LedgerButton onClick={() => setEdits({})}>Discard {dirtyCount}</LedgerButton>
                ) : null}
                <LedgerButton
                  variant="solid"
                  disabled={busy || !dirtyCount}
                  onClick={() => void saveAll()}
                >
                  {busy ? "Saving…" : dirtyCount ? `Save ${dirtyCount} changes` : "Saved"}
                </LedgerButton>
              </>
            ) : null}
          </>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left">
              <th className="label-caps sticky left-0 bg-secondary px-4 py-2 font-normal">
                Student
              </th>
              <th className="label-caps px-3 py-2 font-normal">ID</th>
              {(assessments ?? []).map((a) => (
                <th key={a.id} className="px-3 py-2 text-right font-normal">
                  <span className="label-caps block">{a.kind}</span>
                  <span className="text-[12px] font-medium text-foreground">{a.name}</span>
                  <span className="num block text-[11px] text-mute">/ {a.max_marks}</span>
                </th>
              ))}
              <th className="label-caps px-3 py-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => {
              let total = 0;
              return (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="sticky left-0 bg-card px-4 py-1.5 font-medium">
                    <span className="inline-flex items-center gap-2">
                      {s.name}
                      {!isOwner && s.id === myStudentId ? (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-inksoft">
                          You
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="num px-3 py-1.5">{s.roll}</td>
                  {(assessments ?? []).map((a) => {
                    const key = `${s.id}:${a.id}`;
                    const value =
                      edits[key] ??
                      (saved[key] === null || saved[key] === undefined ? "" : String(saved[key]));
                    const parsed = Number(value);
                    if (value !== "" && Number.isFinite(parsed)) total += parsed;
                    return (
                      <td key={a.id} className="px-2 py-1.5 text-right">
                        {isOwner ? (
                          <input
                            value={value}
                            inputMode="decimal"
                            onChange={(e) => setEdits((d) => ({ ...d, [key]: e.target.value }))}
                            className={
                              "num w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" +
                              (Number(value) > Number(a.max_marks)
                                ? " border-destructive text-destructive"
                                : "")
                            }
                            placeholder="—"
                            aria-label={`${s.name} ${a.name}`}
                          />
                        ) : (
                          <span className="num">{value === "" ? "—" : value}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="num px-3 py-1.5 text-right font-medium">
                    {Number.isInteger(total) ? total : Number(total.toFixed(2))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
