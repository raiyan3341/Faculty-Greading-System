import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LedgerButton } from "@/components/ledger";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Registrar" },
      { name: "description", content: "Sign in with Google to manage your university classes in Registrar." },
      { property: "og:title", content: "Sign in — Registrar" },
      { property: "og:description", content: "Sign in with Google to manage your university classes." },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.6 2.3 2.2 6.7 2.2 12S6.6 21.7 12 21.7c5.7 0 9.5-4 9.5-9.6 0-.7-.1-1.2-.2-1.9H12z"
      />
    </svg>
  );
}

function AuthPage() {
  const { session, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 text-paper lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-md bg-paper text-sm font-semibold text-ink">R</div>
          <span className="text-[15px] font-semibold tracking-tight">Registrar</span>
        </Link>
        <div>
          <h1 className="max-w-[26ch] text-3xl font-semibold tracking-tight">
            The academic ledger for your classes.
          </h1>
          <p className="mt-3 max-w-[44ch] text-sm text-paper/70">
            Sign in once. Create classes as faculty, join others as a student — the same account
            works for both, and every class stays separate.
          </p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-paper/45">
          Attendance · Assessments · Grading · Reports
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="fade-up w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              R
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Registrar</span>
          </Link>
          <p className="label-caps">Faculty &amp; students</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to continue</h2>
          <p className="mt-2 text-sm text-mute">
            Registrar uses your Google account. No separate registration, no role to pick — creating
            a class makes you its faculty, joining one makes you a student.
          </p>

          <LedgerButton
            variant="solid"
            className="mt-6 w-full gap-2.5 py-2.5"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const result = await signInWithGoogle();
              if (result.error) {
                setError(result.error);
                setBusy(false);
              }
            }}
          >
            <span className="grid size-5 place-items-center rounded-full bg-paper">
              <GoogleMark />
            </span>
            {busy ? "Opening Google…" : "Continue with Google"}
          </LedgerButton>

          {error ? (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          <p className="mt-6 text-[11px] text-mute">
            By continuing you agree to keep student records confidential as required by your
            institution.
          </p>
        </div>
      </div>
    </div>
  );
}
