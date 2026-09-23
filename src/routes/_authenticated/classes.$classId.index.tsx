import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import {
  attendanceByStudent,
  useAssessments,
  useAttendance,
  useClass,
  useNotices,
  useStudents,
} from "@/lib/data";
import { EmptyState, LedgerButton, Panel, PanelHeader } from "@/components/ledger";
import { fmt } from "@/lib/grading";

export const Route = createFileRoute("/_authenticated/classes/$classId/")({
  head: () => ({
    meta: [
      { title: "Class overview — Registrar" },
      { name: "description", content: "Class details, roster size, assessments and recent activity." },
      { property: "og:title", content: "Class overview — Registrar" },
      { property: "og:description", content: "Class details, roster size and recent activity." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: students } = useStudents(classId);
  const { data: assessments } = useAssessments(classId);
  const { data: attendance } = useAttendance(classId);
  const { data: notices } = useNotices(classId);
  const isOwner = cls?.owner_id === user?.id;

  const stats = attendanceByStudent(attendance?.sessions ?? [], attendance?.records ?? []);
  const values = Object.values(stats);
  const avgAttendance = values.length
    ? values.reduce((a, b) => a + b.percentage, 0) / values.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Students", value: students?.length ?? 0 },
          { label: "Assessments", value: assessments?.length ?? 0 },
          { label: "Attendance sessions", value: attendance?.sessions.length ?? 0 },
          { label: "Average attendance", value: `${fmt(avgAttendance)}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-card p-4 ring-1 ring-black/5">
            <p className="label-caps">{s.label}</p>
            <p className="num mt-1.5 text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader title="Class information" />
          <dl className="grid gap-3 p-5 sm:grid-cols-2">
            {[
              ["Department", cls?.department],
              ["Subject", cls?.subject],
              ["Section", cls?.section],
              ["Semester", cls?.semester],
              ["Academic year", cls?.academic_year],
              ["Room", cls?.room ?? "—"],
              ["Schedule", cls?.schedule ?? "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="label-caps">{label}</dt>
                <dd className="mt-0.5 text-sm">{value || "—"}</dd>
              </div>
            ))}
            {cls?.description ? (
              <div className="sm:col-span-2">
                <dt className="label-caps">Description</dt>
                <dd className="mt-0.5 text-sm text-inksoft">{cls.description}</dd>
              </div>
            ) : null}
          </dl>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent notices"
            actions={
              <Link to="/classes/$classId/notices" params={{ classId }}>
                <LedgerButton>All notices</LedgerButton>
              </Link>
            }
          />
          {(notices ?? []).length === 0 ? (
            <EmptyState
              title="No notices yet"
              description={
                isOwner
                  ? "Post a notice to tell this class about classes, exams or deadlines."
                  : "Your faculty hasn't posted anything yet."
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {(notices ?? []).slice(0, 5).map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[13px] text-mute">{n.body}</p>
                      ) : null}
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

      <Panel>
        <PanelHeader title="Quick actions" hint={isOwner ? "Faculty tools" : "Student view"} />
        <div className="flex flex-wrap gap-2 p-4">
          {(isOwner
            ? ([
                ["/classes/$classId/students", "Manage students"],
                ["/classes/$classId/attendance", "Take attendance"],
                ["/classes/$classId/assessments", "Create assessment"],
                ["/classes/$classId/marks", "Enter marks"],
                ["/classes/$classId/reports", "Generate report"],
              ] as const)
            : ([
                ["/classes/$classId/attendance", "My attendance"],
                ["/classes/$classId/results", "My result"],
                ["/classes/$classId/resources", "Resources"],
                ["/classes/$classId/discussion", "Discussion"],
              ] as const)
          ).map(([to, label]) => (
            <Link key={to} to={to} params={{ classId }}>
              <LedgerButton>{label}</LedgerButton>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
