import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  Lock,
  Menu,
  MessageSquare,
  Megaphone,
  ScanLine,
  ShieldCheck,
  Sigma,
  Sparkles,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { GradeBadge } from "@/components/ledger";
import { useAuth } from "@/lib/auth";
import { computeResult, fmt, type Assessment, type GradeStep, type Weights } from "@/lib/grading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registrar — Academic Class, Attendance & Grading Ledger" },
      {
        name: "description",
        content:
          "Create a class, share the code, scan your student list with OCR, track attendance, enter marks, and generate official PDF or Excel marksheets.",
      },
      { property: "og:title", content: "Registrar — Academic Class, Attendance & Grading Ledger" },
      {
        property: "og:description",
        content:
          "Attendance, assessments, AI roster scanning, weighted grading, and registrar-ready reports for university faculty.",
      },
    ],
  }),
  component: Landing,
});

const heroStats = [
  {
    value: "10 Modules",
    label: "Per-Class Workspace",
    hint: "Overview to Official Reports",
    accent: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50 border-indigo-200/80 text-indigo-950",
    sub: "text-indigo-700",
  },
  {
    value: "AI OCR",
    label: "Roster Scanner",
    hint: "Photo & PDF list verification",
    accent: "from-fuchsia-500 to-purple-600",
    bg: "bg-fuchsia-50 border-fuchsia-200/80 text-fuchsia-950",
    sub: "text-fuchsia-700",
  },
  {
    value: "Custom",
    label: "Weights & Grade Scale",
    hint: "CT, Quiz, Mid, Final & Custom",
    accent: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-200/80 text-emerald-950",
    sub: "text-emerald-700",
  },
  {
    value: "1-Click",
    label: "PDF & Excel Export",
    hint: "Preview & registrar-ready sheets",
    accent: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 border-amber-200/80 text-amber-950",
    sub: "text-amber-700",
  },
] as const;

const features = [
  {
    icon: GraduationCap,
    tag: "Organization",
    title: "Multi-Class Ledgers",
    text: "Create unlimited classes with department, section, semester, room, schedule, and unique join codes. Edit or delete anytime.",
    iconBg: "bg-indigo-100 text-indigo-600 ring-indigo-200",
    tagColor: "bg-indigo-50 text-indigo-700",
    borderHover: "hover:border-indigo-300",
  },
  {
    icon: ScanLine,
    tag: "AI Powered",
    title: "OCR Student List Scanner",
    text: "Upload a photo or PDF of your physical student list. Names and IDs are extracted into an editable verification screen before import.",
    iconBg: "bg-violet-100 text-violet-600 ring-violet-200",
    tagColor: "bg-violet-50 text-violet-700",
    borderHover: "hover:border-violet-300",
  },
  {
    icon: Users,
    tag: "Roster",
    title: "Complete Student Management",
    text: "Add, edit, search, and remove students per class with roll numbers, email linking, live attendance %, marks, and current grade.",
    iconBg: "bg-sky-100 text-sky-600 ring-sky-200",
    tagColor: "bg-sky-50 text-sky-700",
    borderHover: "hover:border-sky-300",
  },
  {
    icon: CalendarCheck,
    tag: "Tracking",
    title: "Date-Wise Attendance",
    text: "Create lecture sessions by date, mark Present, Late (0.5 credit), or Absent, and inspect automatic percentage progress bars.",
    iconBg: "bg-emerald-100 text-emerald-600 ring-emerald-200",
    tagColor: "bg-emerald-50 text-emerald-700",
    borderHover: "hover:border-emerald-300",
  },
  {
    icon: ClipboardList,
    tag: "Flexible",
    title: "CT, Quiz & Custom Assessments",
    text: "Define any number of CTs, Quizzes, Presentations, Midterms, Finals, Assignments, Labs, Vivas, or Projects with custom max marks.",
    iconBg: "bg-amber-100 text-amber-600 ring-amber-200",
    tagColor: "bg-amber-50 text-amber-700",
    borderHover: "hover:border-amber-300",
  },
  {
    icon: Sigma,
    tag: "Spreadsheet",
    title: "Fast Marks Entry & Validation",
    text: "Enter and edit marks in a spreadsheet grid with real-time warnings and database validation preventing scores above maximum marks.",
    iconBg: "bg-rose-100 text-rose-600 ring-rose-200",
    tagColor: "bg-rose-50 text-rose-700",
    borderHover: "hover:border-rose-300",
  },
  {
    icon: SlidersHorizontal,
    tag: "Automation",
    title: "Configurable Weighted Grading",
    text: "Customize percentage weights across Attendance and every assessment category, plus full letter-grade thresholds from A+ to F.",
    iconBg: "bg-teal-100 text-teal-600 ring-teal-200",
    tagColor: "bg-teal-50 text-teal-700",
    borderHover: "hover:border-teal-300",
  },
  {
    icon: FileText,
    tag: "Official Output",
    title: "PDF Official Marksheet",
    text: "Preview formatted marksheets in-browser and export clean PDFs carrying department, faculty name, signature line, and grades.",
    iconBg: "bg-orange-100 text-orange-600 ring-orange-200",
    tagColor: "bg-orange-50 text-orange-700",
    borderHover: "hover:border-orange-300",
  },
  {
    icon: FileSpreadsheet,
    tag: "Spreadsheets",
    title: "Excel (.xlsx) & CSV Reports",
    text: "Download complete class marksheets as Excel workbooks and export standalone attendance breakdowns as CSV or PDF.",
    iconBg: "bg-green-100 text-green-600 ring-green-200",
    tagColor: "bg-green-50 text-green-700",
    borderHover: "hover:border-green-300",
  },
  {
    icon: Megaphone,
    tag: "Communication",
    title: "Class Notices & Alerts",
    text: "Post exam schedules, room updates, and class notices with optional file attachments and automatic notifications for class members.",
    iconBg: "bg-blue-100 text-blue-600 ring-blue-200",
    tagColor: "bg-blue-50 text-blue-700",
    borderHover: "hover:border-blue-300",
  },
  {
    icon: FolderOpen,
    tag: "Materials",
    title: "Course Resources Library",
    text: "Share lecture PDFs, slides, notes, and reference images inside each class with secure, time-limited download links.",
    iconBg: "bg-purple-100 text-purple-600 ring-purple-200",
    tagColor: "bg-purple-50 text-purple-700",
    borderHover: "hover:border-purple-300",
  },
  {
    icon: MessageSquare,
    tag: "Collaboration",
    title: "Class Discussion Board",
    text: "Keep academic Q&A organized per class where students ask questions and faculty reply or moderate comments cleanly.",
    iconBg: "bg-pink-100 text-pink-600 ring-pink-200",
    tagColor: "bg-pink-50 text-pink-700",
    borderHover: "hover:border-pink-300",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Sign in with Google",
    text: "One-click Google sign-in. No permanent faculty or student role lock — your role adapts per class.",
    badge: "from-indigo-600 to-violet-600",
    border: "border-indigo-200/80",
  },
  {
    n: "02",
    title: "Create or Join a Class",
    text: "Faculty create a class and share the generated join code; students enter the code for instant read-only access.",
    badge: "from-sky-500 to-cyan-600",
    border: "border-sky-200/80",
  },
  {
    n: "03",
    title: "Scan Roster & Record Marks",
    text: "Scan a printed student list with AI OCR, track session attendance, define assessments, and type marks in a grid.",
    badge: "from-emerald-500 to-teal-600",
    border: "border-emerald-200/80",
  },
  {
    n: "04",
    title: "Grade & Export Reports",
    text: "Weighted totals and letter grades update automatically. Preview and download official PDFs or Excel sheets.",
    badge: "from-amber-500 to-orange-600",
    border: "border-amber-200/80",
  },
] as const;

const sampleMarksheetRows = [
  {
    name: "Rahim Ahmed",
    roll: "210101",
    att: 93.3,
    ct: 18,
    mid: 19,
    final: 27,
    total: "64/70",
    pct: 91.4,
    grade: "A+",
  },
  {
    name: "Nusrat Jahan",
    roll: "210102",
    att: 90.0,
    ct: 17,
    mid: 18,
    final: 25,
    total: "60/70",
    pct: 86.2,
    grade: "A",
  },
  {
    name: "Karim Hasan",
    roll: "210103",
    att: 80.0,
    ct: 15,
    mid: 16,
    final: 22,
    total: "53/70",
    pct: 76.4,
    grade: "B+",
  },
  {
    name: "Tanvir Islam",
    roll: "210104",
    att: 73.3,
    ct: 13,
    mid: 14,
    final: 19,
    total: "46/70",
    pct: 66.8,
    grade: "B-",
  },
] as const;

const sampleOcrRows = [
  { row: 1, name: "Rahim Ahmed", roll: "210101", status: "Matched" },
  { row: 2, name: "Nusrat Jahan", roll: "210102", status: "Matched" },
  { row: 3, name: "Karim Hasan", roll: "210103", status: "Editable" },
  { row: 4, name: "Sadia Akter", roll: "210104", status: "Matched" },
] as const;

const demoAssessments: Assessment[] = [
  {
    id: "ct",
    name: "CT Average",
    kind: "CT",
    max_marks: 20,
    assessment_date: null,
    description: null,
    sort_order: 1,
  },
  {
    id: "quiz",
    name: "Quiz",
    kind: "Quiz",
    max_marks: 10,
    assessment_date: null,
    description: null,
    sort_order: 2,
  },
  {
    id: "pres",
    name: "Presentation",
    kind: "Presentation",
    max_marks: 10,
    assessment_date: null,
    description: null,
    sort_order: 3,
  },
  {
    id: "mid",
    name: "Midterm",
    kind: "Midterm",
    max_marks: 40,
    assessment_date: null,
    description: null,
    sort_order: 4,
  },
  {
    id: "final",
    name: "Final Exam",
    kind: "Final",
    max_marks: 100,
    assessment_date: null,
    description: null,
    sort_order: 5,
  },
];

const demoWeights: Weights = {
  Attendance: 10,
  CT: 20,
  Quiz: 10,
  Presentation: 10,
  Midterm: 20,
  Final: 30,
};

const demoScale: GradeStep[] = [
  { grade: "A+", min: 90 },
  { grade: "A", min: 85 },
  { grade: "A-", min: 80 },
  { grade: "B+", min: 75 },
  { grade: "B", min: 70 },
  { grade: "B-", min: 65 },
  { grade: "C+", min: 60 },
  { grade: "C", min: 55 },
  { grade: "D", min: 50 },
  { grade: "F", min: 0 },
];

const faqs = [
  {
    q: "Can one Google account act as Faculty in one class and Student in another?",
    a: "Yes. Registrar has no permanent global role lock. Creating a class makes you its Faculty with full management tools, while joining another class via its code gives you Student read-only access inside that class.",
  },
  {
    q: "Does joining with a class code add someone to the graded student list automatically?",
    a: "No. Joining with a code grants read-only access to the class workspace (notices, roster, attendance, marks, results, resources, and discussion). Only the Faculty adds official student entries manually or via the AI OCR scanner.",
  },
  {
    q: "How does the AI OCR student list scanner handle messy handwriting or printouts?",
    a: "After you upload an image or PDF, extracted names and roll numbers appear in an interactive verification table where you can edit typos, remove extra rows, or add missing students before clicking Import.",
  },
  {
    q: "Can each class customize its own grading weights and letter-grade thresholds?",
    a: "Yes. Every class stores its own weights (including Attendance, CT, Quiz, Presentation, Midterm, Final, Assignment, Lab, Viva, Project, and Participation) and its own A+ to F percentage scale.",
  },
  {
    q: "Are students, marks, and resources strictly isolated between different classes?",
    a: "Completely. Database Row-Level Security (RLS) scopes every table and file bucket folder by class ID, so records from one class can never leak into or affect another.",
  },
] as const;

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [heroTab, setHeroTab] = useState<"marksheet" | "ocr" | "attendance">("marksheet");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive grading sandbox state
  const [demoAtt, setDemoAtt] = useState(90);
  const [demoScores, setDemoScores] = useState<Record<string, number>>({
    ct: 17,
    quiz: 8.5,
    pres: 9,
    mid: 34,
    final: 86,
  });

  useEffect(() => {
    if (loading || !session || typeof window === "undefined") return;
    const isOAuthCallback =
      window.location.search.includes("code=") || window.location.hash.includes("access_token=");
    if (isOAuthCallback) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  const demoResult = useMemo(
    () =>
      computeResult({
        assessments: demoAssessments,
        scores: demoScores,
        attendance: {
          total: 20,
          present: Math.round((demoAtt / 100) * 20),
          late: 0,
          absent: 20 - Math.round((demoAtt / 100) * 20),
          percentage: demoAtt,
        },
        weights: demoWeights,
        scale: demoScale,
      }),
    [demoAtt, demoScores],
  );

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#roles", label: "Faculty & Students" },
    { href: "#simulator", label: "Grade Engine" },
    { href: "#how", label: "How it works" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.07),_transparent_50%)] bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-500/25">
              R
            </div>
            <div>
              <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
                Registrar
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Academic Ledger
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 font-medium text-inksoft transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {session ? (
              <Link
                to="/classes"
                className="hidden rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-inksoft transition-colors hover:bg-secondary sm:inline-flex"
              >
                My Classes
              </Link>
            ) : null}
            <Link
              to={session ? "/dashboard" : "/auth"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-110"
            >
              {session ? "Open Dashboard" : "Get started"}
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenu((v) => !v)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-white text-inksoft hover:bg-secondary lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenu ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {mobileMenu ? (
          <div className="border-t border-border bg-white px-5 py-3 lg:hidden">
            <nav className="grid gap-1 text-sm">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg px-3 py-2 font-medium text-inksoft hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {item.label}
                </a>
              ))}
              {session ? (
                <Link
                  to="/classes"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg px-3 py-2 font-medium text-inksoft hover:bg-indigo-50 hover:text-indigo-700"
                >
                  My Classes
                </Link>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[1320px] space-y-12 px-5 py-8 lg:space-y-16 lg:py-10">
        {/* Hero Section */}
        <section className="fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white shadow-2xl shadow-indigo-950/25 ring-1 ring-white/10">
          {/* Decorative Ambient Glows */}
          <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 size-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-8 size-64 rounded-full bg-amber-500/15 blur-3xl" />

          <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:p-12">
            {/* Left Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200 backdrop-blur-sm">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                University Faculty &amp; Student Platform
              </div>

              <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl xl:text-5xl">
                Every class keeps its own{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  intelligent academic ledger.
                </span>
              </h1>

              <p className="mt-4 max-w-[52ch] text-pretty text-sm leading-relaxed text-slate-300 sm:text-base">
                Create classes in seconds, share join codes, scan physical student lists with AI
                OCR, track attendance, grade assessments with flexible weights, and export official
                PDF or Excel marksheets — with zero cross-class mixing.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={session ? "/dashboard" : "/auth"}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-105"
                >
                  {session ? "Go to Dashboard" : "Sign in with Google"}
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#simulator"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <Sparkles className="size-4 text-amber-300" />
                  Try Grade Engine
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5 text-xs text-slate-200">
                {[
                  { label: "Google Sign-In", dot: "bg-sky-400" },
                  { label: "AI OCR List Scan", dot: "bg-fuchsia-400" },
                  { label: "Weighted Grading", dot: "bg-emerald-400" },
                  { label: "PDF & Excel Export", dot: "bg-amber-400" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
                  >
                    <span className={cn("size-1.5 rounded-full", chip.dot)} />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Interactive Preview Window */}
            <div className="rounded-xl border border-white/15 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
                    CSE · Section A · Spring 2026
                  </p>
                  <p className="text-sm font-semibold text-white">Database Management System</p>
                </div>
                <span className="num rounded-md border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  CODE: DBMS-A7X92
                </span>
              </div>

              {/* Preview Tab Switcher */}
              <div className="mt-3 flex gap-1.5 rounded-lg bg-white/5 p-1 text-xs">
                {(
                  [
                    { id: "marksheet", label: "Live Marksheet" },
                    { id: "ocr", label: "OCR Scanner" },
                    { id: "attendance", label: "Attendance" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHeroTab(t.id)}
                    className={cn(
                      "flex-1 rounded-md px-2.5 py-1.5 font-medium transition-all",
                      heroTab === t.id
                        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Preview Body */}
              {heroTab === "marksheet" ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white text-ink">
                  <div className="flex items-center justify-between border-b border-border bg-slate-50 px-3 py-2 text-[11px] font-semibold text-inksoft">
                    <span>Class Marksheet Preview</span>
                    <span className="text-emerald-700">Auto-Weighted</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-inksoft">
                          <th className="px-3 py-2">Student</th>
                          <th className="px-2 py-2 text-right">Att.</th>
                          <th className="px-2 py-2 text-right">Marks</th>
                          <th className="px-2 py-2 text-right">%</th>
                          <th className="px-3 py-2 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sampleMarksheetRows.map((r) => (
                          <tr key={r.roll} className="hover:bg-indigo-50/40">
                            <td className="px-3 py-2">
                              <p className="font-semibold text-ink">{r.name}</p>
                              <p className="num text-[10px] text-mute">ID {r.roll}</p>
                            </td>
                            <td className="num px-2 py-2 text-right text-emerald-700">{r.att}%</td>
                            <td className="num px-2 py-2 text-right text-inksoft">{r.total}</td>
                            <td className="num px-2 py-2 text-right font-semibold">{r.pct}%</td>
                            <td className="px-3 py-2 text-right">
                              <GradeBadge grade={r.grade} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {heroTab === "ocr" ? (
                <div className="mt-3 space-y-2.5 rounded-lg border border-white/10 bg-white p-3.5 text-ink">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-md bg-violet-100 text-violet-700">
                        <ScanLine className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">Extracted Student Verification</p>
                        <p className="text-[11px] text-mute">4 rows read from scanned_roster.jpg</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Ready to Import
                    </span>
                  </div>
                  <div className="divide-y divide-border rounded-md border border-border">
                    {sampleOcrRows.map((item) => (
                      <div
                        key={item.row}
                        className="flex items-center justify-between px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="num text-[11px] text-mute">0{item.row}</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="num rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
                            {item.roll}
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-600">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {heroTab === "attendance" ? (
                <div className="mt-3 space-y-2.5 rounded-lg border border-white/10 bg-white p-3.5 text-ink">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Session #15 · Lecture Overview</p>
                    <div className="flex gap-1.5 text-[11px] font-semibold">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                        38 Present
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        3 Late
                      </span>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">
                        2 Absent
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Rahim Ahmed", pct: 95, color: "bg-emerald-500" },
                      { name: "Nusrat Jahan", pct: 88, color: "bg-emerald-500" },
                      { name: "Karim Hasan", pct: 72, color: "bg-amber-500" },
                      { name: "Tanvir Islam", pct: 58, color: "bg-rose-500" },
                    ].map((s) => (
                      <div
                        key={s.name}
                        className="rounded-md border border-border/80 bg-slate-50/70 px-3 py-2"
                      >
                        <div className="flex justify-between text-xs font-medium">
                          <span>{s.name}</span>
                          <span className="num">{s.pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={cn("h-full rounded-full", s.color)}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-3.5 text-emerald-400" />
                  Row-Level Isolated per Class
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileSpreadsheet className="size-3.5 text-amber-300" />
                  PDF, Excel (.xlsx) &amp; CSV Ready
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Colourful KPI / Platform Highlight Strip */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map((item) => (
            <div
              key={item.label}
              className={cn(
                "relative overflow-hidden rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-0.5",
                item.bg,
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", item.accent)} />
              <p className="num text-2xl font-bold tracking-tight">{item.value}</p>
              <p className="mt-1 text-sm font-semibold">{item.label}</p>
              <p className={cn("mt-0.5 text-xs", item.sub)}>{item.hint}</p>
            </div>
          ))}
        </section>

        {/* Main Features Section */}
        <section id="features" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                <BookOpen className="size-3.5" />
                Complete Academic Toolkit
              </span>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Everything faculty and students need in one class ledger
              </h2>
            </div>
            <p className="max-w-md text-sm text-inksoft">
              Built for real university workflows — from taking first-day attendance to handing in
              the final signed marksheet.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={cn(
                  "group rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                  f.borderHover,
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl ring-1 transition-transform group-hover:scale-105",
                      f.iconBg,
                    )}
                  >
                    <f.icon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      f.tagColor,
                    )}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-bold tracking-tight text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Role Comparison: Faculty vs Student */}
        <section id="roles" className="scroll-mt-24 space-y-5">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <Users className="size-3.5" />
              Dynamic Per-Class Roles
            </span>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
              One account, two modes — decided by each class
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-inksoft">
              There is no rigid permanent registration role. Create a class to manage it as Faculty,
              or enter a class code to access it read-only as a Student.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Faculty Card */}
            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-md shadow-indigo-500/5">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                    Create a Class
                  </span>
                  <GraduationCap className="size-6 text-indigo-100" />
                </div>
                <h3 className="mt-3 text-xl font-bold">Faculty / Instructor Mode</h3>
                <p className="mt-1 text-sm text-indigo-100">
                  Full academic control over every class you create.
                </p>
              </div>
              <ul className="grid gap-2.5 p-6 text-sm text-inksoft sm:grid-cols-2">
                {[
                  "Generate & share unique class code",
                  "Add students manually or via AI OCR",
                  "Edit class info & delete class safely",
                  "Create, edit & delete attendance sessions",
                  "Define CTs, Quizzes, Labs & custom items",
                  "Enter & validate spreadsheet marks",
                  "Customize weights & letter-grade scale",
                  "Post notices, files & export PDF/Excel",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Student Card */}
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-md shadow-emerald-500/5">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                    Join via Class Code
                  </span>
                  <Award className="size-6 text-emerald-100" />
                </div>
                <h3 className="mt-3 text-xl font-bold">Student Read-Only Mode</h3>
                <p className="mt-1 text-sm text-emerald-100">
                  Transparent access to class records without editing privileges.
                </p>
              </div>
              <ul className="grid gap-2.5 p-6 text-sm text-inksoft sm:grid-cols-2">
                {[
                  "Join multiple classes with class codes",
                  "View full class student roster & standing",
                  "Inspect attendance sessions & percentages",
                  "View all assessment marks read-only",
                  "Check class marksheet & grade scale",
                  "See component-wise grade calculation",
                  "Read notices & download study resources",
                  "Ask questions in class discussion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Interactive Grade Engine Simulator */}
        <section
          id="simulator"
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-lg shadow-indigo-500/5"
        >
          <div className="border-b border-border bg-gradient-to-r from-indigo-50 via-violet-50 to-emerald-50 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-200">
                  <BarChart3 className="size-3.5" />
                  Interactive Grading Engine Demo
                </span>
                <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                  See automatic weighted grading in action
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Top Scorer",
                    att: 95,
                    scores: { ct: 19, quiz: 9.5, pres: 9.5, mid: 38, final: 92 },
                  },
                  {
                    label: "Average",
                    att: 85,
                    scores: { ct: 15, quiz: 7.5, pres: 8, mid: 30, final: 74 },
                  },
                  {
                    label: "Needs Boost",
                    att: 65,
                    scores: { ct: 11, quiz: 5, pres: 6, mid: 21, final: 52 },
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDemoAtt(preset.att);
                      setDemoScores(preset.scores);
                    }}
                    className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Sliders */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Attendance (Weight: 10%)</span>
                  <span className="num text-emerald-700">{demoAtt}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={demoAtt}
                  onChange={(e) => setDemoAtt(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-600"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {demoAssessments.map((a) => {
                  const val = demoScores[a.id] ?? 0;
                  const weight = demoWeights[a.kind] ?? 0;
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-border bg-slate-50/70 p-3.5"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>
                          {a.name} <span className="text-mute">({weight}%)</span>
                        </span>
                        <span className="num text-indigo-700">
                          {val} / {a.max_marks}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={a.max_marks}
                        step={0.5}
                        value={val}
                        onChange={(e) =>
                          setDemoScores((s) => ({ ...s, [a.id]: Number(e.target.value) }))
                        }
                        className="mt-2 w-full accent-indigo-600"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Computed Output */}
            <div className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-300">
                      Computed Student Result
                    </p>
                    <p className="mt-0.5 text-sm text-slate-300">
                      Raw Total:{" "}
                      <span className="num font-semibold text-white">
                        {demoResult.rawTotal} / {demoResult.rawMax}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-3xl font-bold text-emerald-300">
                      {fmt(demoResult.percentage)}%
                    </p>
                    <span className="inline-block rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                      Grade: {demoResult.grade}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {demoResult.components.map((c) => (
                    <div
                      key={c.kind}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                    >
                      <span className="font-medium text-slate-200">
                        {c.kind} <span className="text-slate-400">({c.weight}%)</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="num text-slate-300">
                          {fmt(c.obtained)} / {c.max}
                        </span>
                        <span className="num font-semibold text-indigo-300">
                          +{fmt(c.weighted)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Powered by Registrar&apos;s live grading engine — adjust any weight or letter-grade
                scale per class inside Results.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how" className="scroll-mt-24 space-y-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
              Simple Workflow
            </span>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
              From first lecture to final submission in 4 steps
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className={cn(
                  "rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                  s.border,
                )}
              >
                <span
                  className={cn(
                    "num inline-flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white shadow-sm",
                    s.badge,
                  )}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-[15px] font-bold tracking-tight text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Class Data Isolation & Security Banner */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-emerald-950 sm:text-xl">
                  Strict Class-Wise Data Isolation &amp; Backend Protection
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-emerald-900/80">
                  Every student roster, attendance session, mark, resource, and notice is bound to a
                  single class ID and guarded by PostgreSQL Row-Level Security. Students of Class A
                  never overlap with Class B, and only class faculty can modify academic records.
                </p>
              </div>
            </div>
            <Link
              to={session ? "/classes/new" : "/auth"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
            >
              {session ? "Create a Class" : "Start Free with Google"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="scroll-mt-24 space-y-5">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
              Questions &amp; Answers
            </span>
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mx-auto max-w-3xl space-y-2.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink hover:bg-slate-50"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-indigo-600 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border/60 bg-slate-50/50 px-5 py-3.5 text-sm leading-relaxed text-inksoft">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-center text-white shadow-xl shadow-indigo-600/20 sm:p-10">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to run your semester on one clean ledger?
            </h2>
            <p className="mt-2.5 text-sm text-indigo-100 sm:text-base">
              Sign in with Google, create your first class or join with a code, and keep every mark,
              session, and report perfectly organized.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={session ? "/dashboard" : "/auth"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-md transition-transform hover:-translate-y-0.5"
              >
                {session ? "Open Dashboard" : "Login / Get started"}
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Review all features
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border bg-white/80">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                R
              </div>
              <p className="text-[15px] font-bold tracking-tight">Registrar</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-mute">
              Academic class, attendance, assessment, and grading management designed for university
              faculty and students — with strict per-class isolation.
            </p>
          </div>

          <div>
            <p className="label-caps">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-inksoft">
              <li>
                <a href="#features" className="hover:text-indigo-600">
                  Features
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-indigo-600">
                  Faculty &amp; Students
                </a>
              </li>
              <li>
                <a href="#simulator" className="hover:text-indigo-600">
                  Grade Engine Demo
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-indigo-600">
                  How it works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-indigo-600">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="label-caps">Inside Registrar</p>
            <ul className="mt-3 space-y-2 text-sm text-inksoft">
              <li>AI OCR Student Scanner</li>
              <li>Attendance &amp; Analytics</li>
              <li>Spreadsheet Marks Entry</li>
              <li>Weighted Letter Grading</li>
              <li>Official PDF &amp; Excel Reports</li>
            </ul>
          </div>

          <div>
            <p className="label-caps">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-inksoft">
              <li>
                <Link to="/auth" className="hover:text-indigo-600">
                  Sign in with Google
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-indigo-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/classes" className="hover:text-indigo-600">
                  My Classes
                </Link>
              </li>
              <li>
                <Link to="/classes/new" className="hover:text-indigo-600">
                  Create Class
                </Link>
              </li>
              <li>
                <Link to="/classes/join" className="hover:text-indigo-600">
                  Join Class
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-2 text-xs text-mute">
            <p>
              © {new Date().getFullYear()} Registrar. Academic Class &amp; Assessment Management.
            </p>
            <p>Class-isolated ledgers · Google OAuth · PDF &amp; Excel Exports</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
