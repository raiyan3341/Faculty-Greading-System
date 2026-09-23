import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMyClasses, useClassStudentCount, useNotifications } from "@/lib/data";
import { EmptyState, LedgerButton, Loading, Panel, PanelHeader, SearchInput } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Registrar" },
      { name: "description", content: "Your classes, students and recent academic activity at a glance." },
      { property: "og:title", content: "Dashboard — Registrar" },
      { property: "og:description", content: "Your classes, students and recent academic activity." },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg bg-card p-4 ring-1 ring-black/5">
      <p className="label-caps">{label}</p>
      <p className="num mt-1.5 text-2xl">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-mute">{hint}</p> : null}
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
    <div className="fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}` : "Welcome"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/classes/new">
            <LedgerButton variant="solid">Create Class</LedgerButton>
          </Link>
          <Link to="/classes/join">
            <LedgerButton>Join Class</LedgerButton>
          </Link>
          <Link to="/classes">
            <LedgerButton>Open My Classes</LedgerButton>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Classes created" value={owned.length} hint="You are faculty" />
        <Stat label="Classes joined" value={joined.length} hint="You are a student" />
        <Stat label="Students enrolled" value={totalStudents} hint="Across your classes" />
        <Stat
          label="Unread updates"
          value={(notifications ?? []).filter((n) => !n.read_at).length}
          hint="Notices, marks, attendance"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeader
            title="Recent classes"
            hint={`${all.length} shown`}
            actions={<SearchInput value={q} onChange={setQ} placeholder="Search classes" className="w-56" />}
          />
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
            <ul className="divide-y divide-border">
              {all.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/classes/$classId"
                    params={{ classId: c.id }}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.subject}</p>
                      <p className="num mt-0.5 text-[11px] text-mute">
                        {c.department} · Sec {c.section} · {c.semester} · {c.academic_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.role === "Faculty" ? (
                        <span className="num text-[11px] text-mute">
                          {counts.data?.[c.id] ?? 0} students
                        </span>
                      ) : null}
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-inksoft">
                        {c.role}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Recent activity" hint="Notices, marks, attendance" />
          {(notifications ?? []).length === 0 ? (
            <EmptyState title="Nothing yet" description="Updates from your classes will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {(notifications ?? []).slice(0, 8).map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-[13px] text-mute">{n.body}</p> : null}
                    </div>
                    <span className="num shrink-0 text-[11px] text-mute">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
