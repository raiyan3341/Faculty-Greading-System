import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LedgerButton, Panel, PanelHeader, TextField } from "@/components/ledger";

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
    <div className="fade-up mx-auto max-w-xl space-y-4">
      <div>
        <p className="label-caps">Join Class</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Enter your class code</h1>
        <p className="mt-1 text-sm text-mute">
          Joining makes you a student of that class only. Your other classes stay exactly as they are.
        </p>
      </div>

      <Panel>
        <PanelHeader title="Class code" hint="Provided by your faculty" />
        <form onSubmit={verify} className="space-y-4 p-5">
          <TextField
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DS-A7KQM2"
            className="num"
          />
          <LedgerButton type="submit" variant="solid" disabled={busy}>
            {busy ? "Checking…" : "Verify class"}
          </LedgerButton>
        </form>
      </Panel>

      {found ? (
        <Panel>
          <PanelHeader title="Confirm joining" hint="Check these details are right" />
          <dl className="grid gap-3 p-5 sm:grid-cols-2">
            <div>
              <dt className="label-caps">Subject</dt>
              <dd className="mt-0.5 text-sm font-medium">{found.subject}</dd>
            </div>
            <div>
              <dt className="label-caps">Department</dt>
              <dd className="mt-0.5 text-sm">{found.department}</dd>
            </div>
            <div>
              <dt className="label-caps">Section · Semester</dt>
              <dd className="num mt-0.5 text-sm">
                {found.section} · {found.semester}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Academic year</dt>
              <dd className="num mt-0.5 text-sm">{found.academic_year}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="label-caps">Faculty</dt>
              <dd className="mt-0.5 text-sm">{found.faculty_name ?? "—"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">
            {found.is_owner ? (
              <>
                <p className="text-sm text-mute">You are the faculty of this class.</p>
                <Link to="/classes/$classId" params={{ classId: found.id }}>
                  <LedgerButton variant="solid">Open class</LedgerButton>
                </Link>
              </>
            ) : found.already_member ? (
              <>
                <p className="text-sm text-mute">You have already joined this class.</p>
                <Link to="/classes/$classId" params={{ classId: found.id }}>
                  <LedgerButton variant="solid">Open class</LedgerButton>
                </Link>
              </>
            ) : (
              <>
                <LedgerButton variant="solid" disabled={busy} onClick={() => void confirmJoin()}>
                  {busy ? "Joining…" : "Confirm & join"}
                </LedgerButton>
                <LedgerButton onClick={() => setFound(null)}>Cancel</LedgerButton>
              </>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
