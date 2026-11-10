import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BookOpen, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LedgerButton, TextField } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/join")({
  head: () => ({
    meta: [
      { title: "Join a class — Registrar" },
      { name: "description", content: "Enter a class code to join a class as a student." },
      { property: "og:title", content: "Join a class — Registrar" },
      { property: "og:description", content: "Enter a class code to join as a student." },
    ],
  }),
  component: JoinClass,
});

type Lookup = {
  id: string;
  department: string;
  subject: string;
  section: string;
  semester: string;
  academic_year: string;
  faculty_name: string | null;
  already_member: boolean;
  is_owner: boolean;
};

function JoinClass() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Lookup | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Enter a class code.");
      return;
    }
    setBusy(true);
    setFound(null);
    const { data, error } = await supabase.rpc("lookup_class", { _code: trimmed });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = (data as unknown as Lookup[])?.[0];
    if (!row) {
      toast.error("No class matches that code. Check it with your faculty.");
      return;
    }
    setFound(row);
  }

  async function confirmJoin() {
    if (!found) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("join_class", { _code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["my-classes"] });
    toast.success(`Joined ${found.subject}`);
    void navigate({ to: "/classes/$classId", params: { classId: (data as string) ?? found.id } });
  }

  return (
    <div className="fade-up mx-auto max-w-2xl space-y-6">
      {/* Vibrant Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg shadow-emerald-600/15 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <KeyRound className="size-6 text-white" />
          </span>
          <div>
            <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-50">
              Join Class
            </span>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
              Enter your class code
            </h1>
            <p className="mt-1 text-sm text-emerald-50/90">
              Joining gives you read-only student access to that class only. Your other classes stay
              completely separate.
            </p>
          </div>
        </div>
      </section>

      {/* Step 1: Enter Code */}
      <section className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-emerald-50 via-white to-teal-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="num grid size-6 place-items-center rounded-md bg-emerald-600 text-[11px] font-bold text-white">
              1
            </span>
            <h2 className="text-sm font-bold tracking-tight text-ink">Class code</h2>
          </div>
          <span className="text-xs text-mute">Provided by your faculty</span>
        </div>

        <form onSubmit={verify} className="space-y-4 p-5">
          <TextField
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DS-A7KQM2"
            hint="Case-insensitive — example: DBMS-A7X92"
            className="num"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Checking…" : "Verify class"}
              <ArrowRight className="size-4" />
            </button>
            <Link to="/classes">
              <LedgerButton type="button">Back to My Classes</LedgerButton>
            </Link>
          </div>
        </form>
      </section>

      {/* Step 2: Confirm Class Details */}
      {found ? (
        <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md shadow-indigo-500/5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-indigo-50 via-white to-emerald-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="num grid size-6 place-items-center rounded-md bg-indigo-600 text-[11px] font-bold text-white">
                2
              </span>
              <h2 className="text-sm font-bold tracking-tight text-ink">Confirm joining</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              Class Verified
            </span>
          </div>

          <dl className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3.5">
              <dt className="label-caps">Subject</dt>
              <dd className="mt-1 text-sm font-bold text-ink">{found.subject}</dd>
            </div>
            <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3.5">
              <dt className="label-caps">Department</dt>
              <dd className="mt-1 text-sm font-medium text-inksoft">{found.department}</dd>
            </div>
            <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3.5">
              <dt className="label-caps">Section · Semester</dt>
              <dd className="num mt-1 text-sm font-medium text-ink">
                {found.section} · {found.semester}
              </dd>
            </div>
            <div className="rounded-xl border border-border/80 bg-slate-50/70 p-3.5">
              <dt className="label-caps">Academic year</dt>
              <dd className="num mt-1 text-sm font-medium text-ink">{found.academic_year}</dd>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 sm:col-span-2">
              <dt className="label-caps text-indigo-700">Faculty</dt>
              <dd className="mt-1 text-sm font-semibold text-indigo-950">
                {found.faculty_name ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-border bg-slate-50/50 px-5 py-4">
            {found.is_owner ? (
              <>
                <p className="text-sm font-medium text-indigo-700">
                  You are the faculty of this class.
                </p>
                <Link to="/classes/$classId" params={{ classId: found.id }}>
                  <LedgerButton variant="solid">Open class</LedgerButton>
                </Link>
              </>
            ) : found.already_member ? (
              <>
                <p className="text-sm font-medium text-emerald-700">
                  You have already joined this class.
                </p>
                <Link to="/classes/$classId" params={{ classId: found.id }}>
                  <LedgerButton variant="solid">Open class</LedgerButton>
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmJoin()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {busy ? "Joining…" : "Confirm & join"}
                </button>
                <LedgerButton onClick={() => setFound(null)}>Cancel</LedgerButton>
              </>
            )}
          </div>
        </section>
      ) : null}

      {/* Info Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <BookOpen className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">Read-Only Class Access</p>
            <p className="mt-0.5 text-xs text-mute">
              View notices, roster, attendance, marks, results &amp; resources anytime.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-ink">Class-Isolated Data</p>
            <p className="mt-0.5 text-xs text-mute">
              Joining or leaving one class never affects your other classes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
