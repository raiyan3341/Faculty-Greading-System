import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  CalendarCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  ScanLine,
  Sigma,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registrar — One ledger per university class" },
      {
        name: "description",
        content:
          "Create a class, share the code, scan your student list, track attendance, enter marks and generate an official PDF or Excel marksheet.",
      },
      { property: "og:title", content: "Registrar — One ledger per university class" },
      {
        property: "og:description",
        content:
          "Attendance, assessments, weighted grading and registrar-ready reports for university faculty.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: GraduationCap,
    title: "Class Management",
    text: "Unlimited classes, each with its own code and ledger.",
  },
  {
    icon: Users,
    title: "Student Management",
    text: "Roster per class with roll, email and live standing.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracking",
    text: "Sessions by date with present, late and absent.",
  },
  {
    icon: ClipboardList,
    title: "CT / Quiz / Presentation",
    text: "Any number of assessments, plus custom ones.",
  },
  {
    icon: Sigma,
    title: "Mid & Final Marks",
    text: "Spreadsheet entry with maximum-mark validation.",
  },
  {
    icon: FileText,
    title: "Automatic Grading",
    text: "Configurable weights and letter-grade scale.",
  },
  {
    icon: ScanLine,
    title: "Student List Scanner",
    text: "Read names and roll numbers from a photo or PDF.",
  },
  {
    icon: FolderOpen,
    title: "Notes & Resources",
    text: "Share notices and study material with the class.",
  },
  {
    icon: FileSpreadsheet,
    title: "PDF / Excel Reports",
    text: "Official marksheet and attendance exports.",
  },
];

const steps = [
  { n: "01", title: "Sign in", text: "Use your Google account. No separate registration." },
  {
    n: "02",
    title: "Create or join a class",
    text: "Faculty create and share a code; students join with it.",
  },
  {
    n: "03",
    title: "Run the semester",
    text: "Roster, attendance, assessments and marks — all per class.",
  },
  {
    n: "04",
    title: "Generate the report",
    text: "Official PDF marksheet or Excel export in one click.",
  },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !session || typeof window === "undefined") return;
    const isOAuthCallback =
      window.location.search.includes("code=") || window.location.hash.includes("access_token=");
    if (isOAuthCallback) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              R
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-none tracking-tight">Registrar</p>
              <p className="label-caps mt-0.5">Academic Office</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 text-sm lg:flex">
            <a
              href="#features"
              className="rounded-md px-3 py-1.5 text-inksoft transition-colors hover:bg-secondary"
            >
              Features
            </a>
            <a
              href="#how"
              className="rounded-md px-3 py-1.5 text-inksoft transition-colors hover:bg-secondary"
            >
              How it works
            </a>
          </nav>
          <Link
            to={session ? "/dashboard" : "/auth"}
            className="rounded-md bg-oxblood px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-sealred"
          >
            {session ? "Dashboard" : "Get started"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-6 px-5 py-6">
        <section className="fade-up overflow-hidden rounded-xl bg-ink text-paper">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 lg:p-10">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-paper/60">
                <span>University faculty</span>
                <span className="size-1 rounded-full bg-gold" />
                <span>Class &amp; assessment ledger</span>
              </div>
              <h1 className="mt-4 max-w-[34ch] text-balance text-3xl font-semibold tracking-tight xl:text-4xl">
                Every class keeps its own ledger.
              </h1>
              <p className="mt-3 max-w-[48ch] text-pretty text-sm text-paper/70">
                Create a class, share its code, scan your printed student list, record attendance,
                enter marks in a spreadsheet, and hand in an official marksheet. Nothing from one
                class ever mixes with another.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to={session ? "/dashboard" : "/auth"}
                  className="rounded-md bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream"
                >
                  {session ? "Open Dashboard" : "Login / Get started"}
                </Link>
                <a href="#how" className="text-sm text-paper/70 transition-colors hover:text-paper">
                  See how it works →
                </a>
              </div>
            </div>
            <div className="grid content-center gap-4 border-t border-paper/10 bg-ink/60 p-8 lg:grid-cols-3 lg:border-l lg:border-t-0 lg:p-10">
              <div>
                <p className="label-caps text-paper/50">Attendance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">P / L / A</p>
              </div>
              <div>
                <p className="label-caps text-paper/50">Assessments</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">Any</p>
              </div>
              <div>
                <p className="label-caps text-paper/50">Grading</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">Weighted</p>
              </div>
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-paper/50">
                  <span>Semester progress</span>
                  <span>Marksheet ready</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-paper/15">
                  <div className="h-full w-[87%] rounded-full bg-gold" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Main features</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg bg-card p-4 ring-1 ring-black/5">
                <f.icon className="size-4 text-oxblood" />
                <p className="mt-3 text-sm font-semibold tracking-tight">{f.title}</p>
                <p className="mt-1 text-sm text-mute">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-lg bg-card p-4 ring-1 ring-black/5">
                <span className="num text-xs text-mute">{s.n}</span>
                <p className="mt-2 text-sm font-semibold tracking-tight">{s.title}</p>
                <p className="mt-1 text-sm text-mute">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-6 px-5 py-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                R
              </div>
              <p className="text-sm font-semibold tracking-tight">Registrar</p>
            </div>
            <p className="mt-2 text-sm text-mute">
              Academic class and assessment management for university faculty — attendance, marks,
              grading and official reports.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div>
              <p className="label-caps">Navigate</p>
              <ul className="mt-2 space-y-1.5 text-inksoft">
                <li>
                  <a href="#features" className="hover:text-foreground">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-foreground">
                    How it works
                  </a>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-foreground">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label-caps">Account</p>
              <ul className="mt-2 space-y-1.5 text-inksoft">
                <li>
                  <Link to="/dashboard" className="hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/classes" className="hover:text-foreground">
                    My Classes
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <p className="mx-auto max-w-[1320px] text-[11px] text-mute">
            © {new Date().getFullYear()} Registrar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
