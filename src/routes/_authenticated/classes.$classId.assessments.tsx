import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notifyClass, useAssessments, useClass, type AssessmentRow } from "@/lib/data";
import { ASSESSMENT_KINDS } from "@/lib/grading";
import {
  ConfirmButton,
  EmptyState,
  LedgerButton,
  Loading,
  Panel,
  PanelHeader,
  TextArea,
  TextField,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments — Registrar" },
      {
        name: "description",
        content: "Class tests, quizzes, presentations, midterm, final and custom assessments.",
      },
      { property: "og:title", content: "Assessments — Registrar" },
      { property: "og:description", content: "Assessments defined for this class." },
    ],
  }),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: assessments, isLoading } = useAssessments(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;

  const [editing, setEditing] = useState<AssessmentRow | null>(null);
  const [form, setForm] = useState({
    kind: "CT",
    name: "",
    max_marks: "20",
    assessment_date: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditing(null);
    setForm({ kind: "CT", name: "", max_marks: "20", assessment_date: "", description: "" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    const max = Number(form.max_marks);
    if (!form.name.trim() || !Number.isFinite(max) || max <= 0) {
      toast.error("Give the assessment a name and a maximum mark above zero.");
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      kind: form.kind,
      max_marks: max,
      assessment_date: form.assessment_date || null,
      description: form.description.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("assessments").update(payload).eq("id", editing.id)
      : await supabase.from("assessments").insert({
          class_id: classId,
          sort_order: (assessments?.length ?? 0) + 1,
          ...payload,
        });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!editing) {
      await notifyClass({
        classId,
        actorId: user!.id,
        kind: "assessment",
        title: "New assessment",
        body: `${cls?.subject ?? "Class"}: ${payload.name} (${payload.max_marks} marks)`,
      });
    }
    toast.success(editing ? "Assessment updated" : "Assessment created");
    reset();
    await queryClient.invalidateQueries({ queryKey: ["assessments", classId] });
  }

  async function remove(row: AssessmentRow) {
    if (!isOwner) return;
    const { error } = await supabase.from("assessments").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${row.name} deleted`);
    await queryClient.invalidateQueries({ queryKey: ["assessments", classId] });
    await queryClient.invalidateQueries({ queryKey: ["marks", classId] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Panel>
        <PanelHeader
          title="Assessments"
          hint={isOwner ? "Add as many CTs, quizzes or custom items as you need" : "Read only"}
        />
        {isLoading ? (
          <Loading />
        ) : (assessments ?? []).length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description={
              isOwner
                ? "Create CT 1, a quiz, the midterm — anything this class is marked on."
                : "Your faculty hasn't added assessments yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  <th className="label-caps px-4 py-2 font-normal">Type</th>
                  <th className="label-caps px-3 py-2 font-normal">Name</th>
                  <th className="label-caps px-3 py-2 text-right font-normal">Max marks</th>
                  <th className="label-caps px-3 py-2 font-normal">Date</th>
                  {isOwner ? <th className="px-3 py-2" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(assessments ?? []).map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-inksoft">
                        {a.kind}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{a.name}</p>
                      {a.description ? (
                        <p className="text-[12px] text-mute">{a.description}</p>
                      ) : null}
                    </td>
                    <td className="num px-3 py-2 text-right">{a.max_marks}</td>
                    <td className="num px-3 py-2">{a.assessment_date ?? "—"}</td>
                    {isOwner ? (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <LedgerButton
                            onClick={() => {
                              setEditing(a);
                              setForm({
                                kind: a.kind,
                                name: a.name,
                                max_marks: String(a.max_marks),
                                assessment_date: a.assessment_date ?? "",
                                description: a.description ?? "",
                              });
                            }}
                          >
                            Edit
                          </LedgerButton>
                          <ConfirmButton
                            label="Delete"
                            message={`Delete "${a.name}"? Only its marks are removed — other assessments and attendance stay untouched.`}
                            onConfirm={() => void remove(a)}
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
        <Panel className="h-fit">
          <PanelHeader title={editing ? "Edit assessment" : "New assessment"} />
          <form onSubmit={save} className="space-y-4 p-4">
            <label className="block">
              <span className="label-caps block">Type</span>
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {ASSESSMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="CT 1"
            />
            <TextField
              label="Maximum marks"
              required
              type="number"
              min={1}
              step="any"
              value={form.max_marks}
              onChange={(e) => setForm((f) => ({ ...f, max_marks: e.target.value }))}
              className="num"
            />
            <TextField
              label="Date"
              type="date"
              value={form.assessment_date}
              onChange={(e) => setForm((f) => ({ ...f, assessment_date: e.target.value }))}
            />
            <TextArea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <LedgerButton type="submit" variant="solid" disabled={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Create assessment"}
              </LedgerButton>
              {editing ? (
                <LedgerButton type="button" onClick={reset}>
                  Cancel
                </LedgerButton>
              ) : null}
            </div>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
