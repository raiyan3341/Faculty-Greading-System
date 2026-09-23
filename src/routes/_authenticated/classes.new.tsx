import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { generateClassCode } from "@/lib/grading";
import { CopyCode, LedgerButton, Panel, PanelHeader, TextArea, TextField } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/new")({
  head: () => ({
    meta: [
      { title: "Create a class — Registrar" },
      { name: "description", content: "Create a class and share its code so students can join." },
      { property: "og:title", content: "Create a class — Registrar" },
      { property: "og:description", content: "Create a class and share its join code." },
    ],
  }),
  component: CreateClass,
});

function CreateClass() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; code: string; subject: string } | null>(null);
  const [form, setForm] = useState({
    department: "",
    subject: "",
    section: "",
    semester: "",
    academic_year: "",
    description: "",
    room: "",
    schedule: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const required = ["department", "subject", "section", "semester", "academic_year"] as const;
    for (const key of required) {
      if (!form[key].trim()) {
        toast.error("Please fill in every required field.");
        return;
      }
    }
    setBusy(true);
    let lastError = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateClassCode(form.subject, form.section);
      const { data, error } = await supabase
        .from("classes")
        .insert({
          owner_id: user!.id,
          department: form.department.trim(),
          subject: form.subject.trim(),
          section: form.section.trim(),
          semester: form.semester.trim(),
          academic_year: form.academic_year.trim(),
          description: form.description.trim() || null,
          room: form.room.trim() || null,
          schedule: form.schedule.trim() || null,
          class_code: code,
        })
        .select("id, class_code, subject")
        .single();
      if (!error && data) {
        setCreated({ id: data.id, code: data.class_code, subject: data.subject });
        await queryClient.invalidateQueries({ queryKey: ["my-classes"] });
        toast.success("Class created");
        setBusy(false);
        return;
      }
      lastError = error?.message ?? "Could not create the class";
      if (!error?.message?.includes("class_code")) break;
    }
    setBusy(false);
    toast.error(lastError);
  }

  if (created) {
    return (
      <div className="fade-up mx-auto max-w-xl space-y-4">
        <Panel>
          <PanelHeader title="Class created" hint="Share the code with your students" />
          <div className="space-y-4 p-6">
            <div>
              <p className="label-caps">Subject</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{created.subject}</p>
            </div>
            <CopyCode code={created.code} />
            <p className="text-sm text-mute">
              Students enter this code in “Join Class”. Anyone who joins becomes a student of this
              class only — nothing is shared with your other classes.
            </p>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Link to="/classes/$classId" params={{ classId: created.id }}>
                <LedgerButton variant="solid">Open class</LedgerButton>
              </Link>
              <Link to="/classes/$classId/students" params={{ classId: created.id }}>
                <LedgerButton>Add students</LedgerButton>
              </Link>
              <LedgerButton onClick={() => setCreated(null)}>Create another</LedgerButton>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="fade-up mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label-caps">Create Class</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New class ledger</h1>
        <p className="mt-1 text-sm text-mute">
          Creating a class makes you its faculty. A unique join code is generated for you.
        </p>
      </div>
      <Panel>
        <PanelHeader title="Class details" hint="Fields marked * are required" />
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
          <TextField label="Department" required value={form.department} onChange={set("department")} placeholder="Computer Science &amp; Engineering" />
          <TextField label="Subject" required value={form.subject} onChange={set("subject")} placeholder="Data Structures" />
          <TextField label="Section" required value={form.section} onChange={set("section")} placeholder="A" />
          <TextField label="Semester" required value={form.semester} onChange={set("semester")} placeholder="4th" />
          <TextField label="Academic year" required value={form.academic_year} onChange={set("academic_year")} placeholder="2025–2026" />
          <TextField label="Room" value={form.room} onChange={set("room")} placeholder="Lab 302 (optional)" />
          <TextField label="Schedule" value={form.schedule} onChange={set("schedule")} placeholder="Sun &amp; Tue, 10:00–11:30 (optional)" className="sm:col-span-2" />
          <TextArea label="Description" value={form.description} onChange={set("description")} rows={3} placeholder="Optional note for students" className="sm:col-span-2" />
          <div className="flex flex-wrap gap-2 border-t border-border pt-4 sm:col-span-2">
            <LedgerButton type="submit" variant="solid" disabled={busy}>
              {busy ? "Creating…" : "Create class"}
            </LedgerButton>
            <Link to="/classes">
              <LedgerButton type="button">Cancel</LedgerButton>
            </Link>
          </div>
        </form>
      </Panel>
    </div>
  );
}
