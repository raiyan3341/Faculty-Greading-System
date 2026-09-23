import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useClass, useOwnerName, useStudents } from "@/lib/data";
import { CopyCode, Loading, Panel } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  component: ClassLayout,
});

const tabs = [
  { to: "/classes/$classId", label: "Overview", exact: true },
  { to: "/classes/$classId/notices", label: "Notices", exact: false },
  { to: "/classes/$classId/students", label: "Students", exact: false },
  { to: "/classes/$classId/attendance", label: "Attendance", exact: false },
  { to: "/classes/$classId/assessments", label: "Assessments", exact: false },
  { to: "/classes/$classId/marks", label: "Marks", exact: false },
  { to: "/classes/$classId/results", label: "Results", exact: false },
  { to: "/classes/$classId/resources", label: "Resources", exact: false },
  { to: "/classes/$classId/discussion", label: "Discussion", exact: false },
  { to: "/classes/$classId/reports", label: "Reports", exact: false },
] as const;

function ClassLayout() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls, isLoading } = useClass(classId);
  const { data: facultyName } = useOwnerName(cls?.owner_id);
  const { data: students } = useStudents(classId);
  const isOwner = !!cls && cls.owner_id === user?.id;

  if (isLoading) {
    return (
      <Panel>
        <Loading label="Opening class" />
      </Panel>
    );
  }

  if (!cls) {
    return (
      <Panel>
        <div className="p-8 text-center">
          <p className="text-sm font-semibold">Class not available</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-mute">
            You don't have access to this class, or it has been deleted. You can only open classes you
            created or joined.
          </p>
          <Link to="/classes" className="mt-4 inline-block text-sm text-oxblood hover:underline">
            Back to my classes
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="fade-up space-y-4">
      <div className="overflow-hidden rounded-xl bg-ink text-paper">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-paper/55">{cls.department}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{cls.subject}</h1>
            <p className="num mt-1 text-[12px] text-paper/65">
              Sec {cls.section} · {cls.semester} · {cls.academic_year}
              {cls.room ? ` · ${cls.room}` : ""}
              {cls.schedule ? ` · ${cls.schedule}` : ""}
            </p>
            <p className="mt-1.5 text-[12px] text-paper/65">
              Faculty: {facultyName ?? "—"}
              {isOwner ? " (you)" : ""} · {students?.length ?? 0} students
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="rounded-md bg-paper/15 px-2 py-0.5 text-[11px] font-medium">
              {isOwner ? "Faculty" : "Student"}
            </span>
            {isOwner ? <CopyCode code={cls.class_code} dark /> : null}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-paper/10 px-3 py-2 text-[13px]">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              params={{ classId }}
              activeOptions={{ exact: tab.exact }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-paper/65 transition-colors hover:bg-paper/10 hover:text-paper"
              activeProps={{ className: "bg-paper text-ink font-medium hover:bg-paper" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
