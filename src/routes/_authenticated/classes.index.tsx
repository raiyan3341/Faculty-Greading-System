import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useClassStudentCount, useMyClasses, type ClassRow } from "@/lib/data";
import {
  ConfirmButton,
  CopyCode,
  EmptyState,
  LedgerButton,
  Loading,
  Panel,
  PanelHeader,
  SearchInput,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/")({
  head: () => ({
    meta: [
      { title: "My Classes — Registrar" },
      { name: "description", content: "Classes you teach and classes you have joined as a student." },
      { property: "og:title", content: "My Classes — Registrar" },
      { property: "og:description", content: "Classes you teach and classes you joined." },
    ],
  }),
  component: MyClasses,
});

function ClassCard({
  row,
  role,
  students,
  onDelete,
  onLeave,
}: {
  row: ClassRow;
  role: "Faculty" | "Student";
  students?: number;
  onDelete?: () => void;
  onLeave?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-card p-4 ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">{row.department}</p>
          <Link
            to="/classes/$classId"
            params={{ classId: row.id }}
            className="mt-1 block text-[15px] font-semibold tracking-tight hover:text-oxblood"
          >
            {row.subject}
          </Link>
          <p className="num mt-1 text-[11px] text-mute">
            Sec {row.section} · {row.semester} · {row.academic_year}
          </p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-inksoft">
          {role}
        </span>
      </div>

      {role === "Faculty" ? (
        <div className="mt-3">
          <CopyCode code={row.class_code} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Link to="/classes/$classId" params={{ classId: row.id }}>
          <LedgerButton>Open</LedgerButton>
        </Link>
        {role === "Faculty" ? (
          <>
            <span className="num text-[11px] text-mute">{students ?? 0} students</span>
            {onDelete ? (
              <ConfirmButton
                label="Delete class"
                message={`Delete "${row.subject}"? All its students, attendance, assessments and marks will be permanently removed. Other classes are unaffected.`}
                onConfirm={onDelete}
              />
            ) : null}
          </>
        ) : onLeave ? (
          <ConfirmButton
            label="Leave class"
            message={`Leave "${row.subject}"? Your other classes are unaffected.`}
            onConfirm={onLeave}
          />
        ) : null}
      </div>
    </div>
  );
}

function MyClasses() {
  const { user } = useAuth();
  const { data, isLoading } = useMyClasses(user?.id);
  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const counts = useClassStudentCount(owned.map((c) => c.id));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const matches = (c: ClassRow) =>
    `${c.subject} ${c.department} ${c.section} ${c.semester} ${c.academic_year} ${c.class_code}`
      .toLowerCase()
      .includes(q.trim().toLowerCase());

  const shownOwned = useMemo(() => owned.filter(matches), [owned, q]);
  const shownJoined = useMemo(() => joined.filter(matches), [joined, q]);

  async function deleteClass(id: string) {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class deleted");
    await queryClient.invalidateQueries({ queryKey: ["my-classes"] });
  }

  async function leaveClass(id: string) {
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", id)
      .eq("user_id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You left the class");
    await queryClient.invalidateQueries({ queryKey: ["my-classes"] });
  }

  return (
    <div className="fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">My Classes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {owned.length} taught · {joined.length} joined
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search classes" className="w-56" />
          <LedgerButton variant="solid" onClick={() => void navigate({ to: "/classes/new" })}>
            Create Class
          </LedgerButton>
          <LedgerButton onClick={() => void navigate({ to: "/classes/join" })}>Join Class</LedgerButton>
        </div>
      </div>

      {isLoading ? (
        <Panel>
          <Loading label="Loading your classes" />
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader title="Classes you teach" hint="You are faculty — full control" />
            {shownOwned.length === 0 ? (
              <EmptyState
                title="No classes created"
                description="Creating a class makes you its faculty. You get the roster, attendance, assessments, marks and reports."
                action={
                  <Link to="/classes/new">
                    <LedgerButton variant="solid">Create Class</LedgerButton>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {shownOwned.map((c) => (
                  <ClassCard
                    key={c.id}
                    row={c}
                    role="Faculty"
                    students={counts.data?.[c.id] ?? 0}
                    onDelete={() => void deleteClass(c.id)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Classes you joined" hint="You are a student — read only" />
            {shownJoined.length === 0 ? (
              <EmptyState
                title="No classes joined"
                description="Ask your faculty for the class code and join to see notices, attendance and your marks."
                action={
                  <Link to="/classes/join">
                    <LedgerButton>Join Class</LedgerButton>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {shownJoined.map((c) => (
                  <ClassCard key={c.id} row={c} role="Student" onLeave={() => void leaveClass(c.id)} />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
