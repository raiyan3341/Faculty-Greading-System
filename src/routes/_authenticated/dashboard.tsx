import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  FolderKanban,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  PlusCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyClasses, useClassStudentCount, useNotifications } from "@/lib/data";
import { EmptyState, LedgerButton, Loading, SearchInput } from "@/components/ledger";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Registrar" },
      {
        name: "description",
        content: "Your classes, students and recent academic activity at a glance.",
      },
      { property: "og:title", content: "Dashboard — Registrar" },
      {
        property: "og:description",
        content: "Your classes, students and recent academic activity.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  cardClass,
  iconClass,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  cardClass: string;
  iconClass: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        cardClass,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent)} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">{label}</p>
          <p className="num mt-2 text-3xl font-bold tracking-tight text-ink">{value}</p>
          {hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
        </div>
        <span
          className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1", iconClass)}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, profile } = useAuth();
  const { data, isLoading } = useMyClasses(user?.id);
  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const counts = useClassStudentCount(owned.map((c) => c.id));
  const { data: notifications } = useNotifications(user?.id);
  const [q, setQ] = useState("");

  const totalStudents = useMemo(
    () => Object.values(counts.data ?? {}).reduce((a, b) => a + b, 0),
    [counts.data],
  );

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  const all = useMemo(
    () =>
      [
        ...owned.map((c) => ({ ...c, role: "Faculty" as const })),
        ...joined.map((c) => ({ ...c, role: "Student" as const })),
      ].filter((c) =>
        `${c.subject} ${c.department} ${c.section} ${c.semester} ${c.academic_year} ${c.class_code}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
      ),
    [owned, joined, q],
  );

  return (
    <div className="fade-up space-y-6">
      {/* Vibrant Dashboard Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-xl shadow-indigo-950/15 ring-1 ring-white/10 sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 size-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Academic Dashboard
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {profile?.full_name
                ? `Welcome back, ${profile.full_name.split(" ")[0]}`
                : "Welcome back"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-300">
              Manage your taught classes, track joined courses, monitor student totals, and stay
              updated across every academic ledger.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/classes/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:brightness-105"
            >
              <PlusCircle className="size-4" />
              Create Class
            </Link>
            <Link
              to="/classes/join"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <KeyRound className="size-4 text-amber-300" />
              Join Class
            </Link>
            <Link
              to="/classes"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <LayoutGrid className="size-4 text-indigo-300" />
              Open My Classes
            </Link>
          </div>
        </div>
      </section>

      {/* Colourful Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Classes created"
          value={owned.length}
          hint="You are faculty"
          icon={GraduationCap}
          accent="from-indigo-500 to-violet-600"
          cardClass="border-indigo-200/80"
          iconClass="bg-indigo-100 text-indigo-600 ring-indigo-200"
        />
        <Stat
          label="Classes joined"
          value={joined.length}
          hint="You are a student"
          icon={BookOpen}
          accent="from-emerald-500 to-teal-600"
          cardClass="border-emerald-200/80"
          iconClass="bg-emerald-100 text-emerald-600 ring-emerald-200"
        />
        <Stat
          label="Students enrolled"
          value={totalStudents}
          hint="Across your classes"
          icon={Users}
          accent="from-sky-500 to-cyan-600"
          cardClass="border-sky-200/80"
          iconClass="bg-sky-100 text-sky-600 ring-sky-200"
        />
        <Stat
          label="Unread updates"
          value={unreadCount}
          hint="Notices, marks, attendance"
          icon={Bell}
          accent="from-amber-500 to-orange-600"
          cardClass="border-amber-200/80"
          iconClass="bg-amber-100 text-amber-600 ring-amber-200"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Recent Classes */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
                <FolderKanban className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-ink">Recent classes</h2>
                <p className="text-[11px] text-mute">{all.length} shown</p>
              </div>
            </div>
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search classes"
              className="w-full sm:w-56"
            />
          </div>

          {isLoading ? (
            <Loading />
          ) : all.length === 0 ? (
            <EmptyState
              title="No classes yet"
              description="Create a class to become its faculty, or join one with a class code."
              action={
                <Link to="/classes/new">
                  <LedgerButton variant="solid">Create your first class</LedgerButton>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border/80">
              {all.slice(0, 8).map((c) => {
                const isFaculty = c.role === "Faculty";
                return (
                  <li key={c.id}>
                    <Link
                      to="/classes/$classId"
                      params={{ classId: c.id }}
                      className="group flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-indigo-50/40"
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
                            isFaculty
                              ? "bg-indigo-100 text-indigo-600 ring-indigo-200"
                              : "bg-emerald-100 text-emerald-600 ring-emerald-200",
                          )}
                        >
                          {isFaculty ? (
                            <GraduationCap className="size-5" />
                          ) : (
                            <BookOpen className="size-5" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink transition-colors group-hover:text-indigo-700">
                            {c.subject}
                          </p>
                          <p className="num mt-0.5 text-[11px] text-mute">
                            {c.department} · Sec {c.section} · {c.semester} · {c.academic_year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {isFaculty ? (
                          <span className="num rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-inksoft">
                            {counts.data?.[c.id] ?? 0} students
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            isFaculty
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {c.role}
                        </span>
                        <ArrowRight className="size-3.5 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent Activity */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-amber-50/80 via-white to-rose-50/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Bell className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-ink">Recent activity</h2>
                <p className="text-[11px] text-mute">Notices, marks, attendance</p>
              </div>
            </div>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              View all →
            </Link>
          </div>

          {(notifications ?? []).length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="Updates from your classes will appear here."
            />
          ) : (
            <ul className="divide-y divide-border/80">
              {(notifications ?? []).slice(0, 8).map((n) => (
                <li
                  key={n.id}
                  className={cn("px-5 py-3.5 transition-colors", !n.read_at && "bg-indigo-50/40")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          !n.read_at ? "bg-indigo-600" : "bg-slate-300",
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">{n.title}</p>
                        {n.body ? <p className="mt-0.5 text-[13px] text-mute">{n.body}</p> : null}
                      </div>
                    </div>
                    <span className="num shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-mute">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
