import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, GraduationCap, PlusCircle, Sparkles, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { generateClassCode } from "@/lib/grading";
import { CopyCode, LedgerButton, TextArea, TextField } from "@/components/ledger";

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
  const [created, setCreated] = useState<{ id: string; code: string; subject: string } | null>(
    null,
  );
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

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
      <div className="fade-up mx-auto max-w-xl space-y-5">
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg shadow-emerald-500/10">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/20">
                <CheckCircle2 className="size-6 text-white" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-white">Class created successfully</h1>
                <p className="text-xs text-emerald-50">
                  Share the join code below with your students
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-border bg-slate-50/70 p-4">
              <p className="label-caps">Subject</p>
              <p className="mt-1 text-lg font-bold tracking-tight text-ink">{created.subject}</p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <p className="mb-2 text-xs font-semibold text-indigo-800">Unique Class Join Code</p>
              <CopyCode code={created.code} />
            </div>

            <p className="text-sm leading-relaxed text-mute">
              Students enter this code in “Join Class”. Anyone who joins gets read-only access to
              this class only — nothing is shared with your other classes.
            </p>

            <div className="flex flex-wrap gap-2.5 border-t border-border pt-4">
              <Link
                to="/classes/$classId"
                params={{ classId: created.id }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
              >
                Open class
                <ArrowRight className="size-4" />
              </Link>
              <Link to="/classes/$classId/students" params={{ classId: created.id }}>
                <LedgerButton className="py-2.5">
                  <Users className="size-4 text-indigo-600" />
                  Add students
                </LedgerButton>
              </Link>
              <LedgerButton className="py-2.5" onClick={() => setCreated(null)}>
                Create another
              </LedgerButton>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fade-up mx-auto max-w-3xl space-y-6">
      {/* Vibrant Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-lg shadow-indigo-700/15 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <GraduationCap className="size-6 text-white" />
          </span>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-100">
              <Sparkles className="size-3" />
              Create Class
            </span>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
              New class ledger
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              Creating a class makes you its faculty. A unique join code is generated automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Form Card */}
      <section className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-indigo-50 via-white to-violet-50/70 px-6 py-4">
          <h2 className="text-sm font-bold tracking-tight text-ink">Class details</h2>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
            Fields marked * are required
          </span>
        </div>

        <form onSubmit={submit} className="space-y-6 p-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Core Academic Information
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Department"
                required
                value={form.department}
                onChange={set("department")}
                placeholder="Computer Science & Engineering"
              />
              <TextField
                label="Subject"
                required
                value={form.subject}
                onChange={set("subject")}
                placeholder="Data Structures"
              />
              <TextField
                label="Section"
                required
                value={form.section}
                onChange={set("section")}
                placeholder="A"
              />
              <TextField
                label="Semester"
                required
                value={form.semester}
                onChange={set("semester")}
                placeholder="4th"
              />
              <TextField
                label="Academic year"
                required
                value={form.academic_year}
                onChange={set("academic_year")}
                placeholder="2025–2026"
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
              Schedule &amp; Notes (Optional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Room"
                value={form.room}
                onChange={set("room")}
                placeholder="Lab 302 (optional)"
              />
              <TextField
                label="Schedule"
                value={form.schedule}
                onChange={set("schedule")}
                placeholder="Sun & Tue, 10:00–11:30 (optional)"
              />
              <TextArea
                label="Description"
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Optional note for students"
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              <PlusCircle className="size-4" />
              {busy ? "Creating…" : "Create class"}
            </button>
            <Link to="/classes">
              <LedgerButton type="button" className="py-2.5">
                Cancel
              </LedgerButton>
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
