import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BookOpen, GraduationCap, KeyRound, PlusCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useClassStudentCount, useMyClasses, type ClassRow } from "@/lib/data";
import {
  ConfirmButton,
  CopyCode,
  EmptyState,
  LedgerButton,
  Loading,
  SearchInput,
} from "@/components/ledger";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/classes/")({
  head: () => ({
    meta: [
      { title: "My Classes — Registrar" },
      {
        name: "description",
        content: "Classes you teach and classes you have joined as a student.",
      },
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
  const isFaculty = role === "Faculty";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isFaculty ? "border-indigo-200/80" : "border-emerald-200/80",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          isFaculty ? "from-indigo-500 to-violet-600" : "from-emerald-500 to-teal-500",
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
              isFaculty ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700",
            )}
          >
            {row.department}
          </span>
          <Link
            to="/classes/$classId"
            params={{ classId: row.id }}
            className="mt-2 block text-[16px] font-bold tracking-tight text-ink transition-colors group-hover:text-indigo-700"
          >
            {row.subject}
          </Link>
          <p className="num mt-1 text-[11px] text-mute">
            Sec {row.section} · {row.semester} · {row.academic_year}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            isFaculty ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700",
          )}
        >
          {isFaculty ? <GraduationCap className="size-3" /> : <BookOpen className="size-3" />}
          {role}
        </span>
      </div>

      {isFaculty ? (
        <div className="mt-3.5">
          <CopyCode code={row.class_code} />
        </div>
      ) : (
        <p className="mt-3.5 text-xs text-mute">
          Read-only access to roster, attendance, marks, notices &amp; resources.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/classes/$classId"
            params={{ classId: row.id }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110",
              isFaculty
                ? "bg-gradient-to-r from-indigo-600 to-violet-600"
                : "bg-gradient-to-r from-emerald-600 to-teal-600",
            )}
          >
            Open
            <ArrowRight className="size-3" />
          </Link>

          {isFaculty ? (
            <span className="num inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-inksoft">
              <Users className="size-3 text-indigo-600" />
              {students ?? 0} students
            </span>
          ) : null}
        </div>

        {isFaculty ? (
          onDelete ? (
            <ConfirmButton
              label="Delete class"
              message={`Delete "${row.subject}"? All its students, attendance, assessments and marks will be permanently removed. Other classes are unaffected.`}
              onConfirm={onDelete}
            />
          ) : null
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
    <div className="fade-up space-y-6">
      {/* Vibrant Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 p-6 text-white shadow-lg shadow-indigo-700/15 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100">
              My Classes
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {owned.length} taught · {joined.length} joined
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              Every class maintains its own isolated roster, attendance, assessments, and grading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search classes"
              className="w-full rounded-lg bg-white text-ink sm:w-56"
            />
            <button
              type="button"
              onClick={() => void navigate({ to: "/classes/new" })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <PlusCircle className="size-4" />
              Create Class
            </button>
            <button
              type="button"
              onClick={() => void navigate({ to: "/classes/join" })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <KeyRound className="size-4" />
              Join Class
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <Loading label="Loading your classes" />
        </div>
      ) : (
        <>
          {/* Taught Classes */}
          <section className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-indigo-50 via-white to-violet-50/70 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200">
                  <GraduationCap className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-ink">Classes you teach</h2>
                  <p className="text-[11px] text-mute">You are faculty — full control</p>
                </div>
              </div>
              <span className="num rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700">
                {shownOwned.length}
              </span>
            </div>

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
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
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
          </section>

          {/* Joined Classes */}
          <section className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-emerald-50 via-white to-teal-50/70 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-ink">Classes you joined</h2>
                  <p className="text-[11px] text-mute">You are a student — read only</p>
                </div>
              </div>
              <span className="num rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700">
                {shownJoined.length}
              </span>
            </div>

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
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {shownJoined.map((c) => (
                  <ClassCard
                    key={c.id}
                    row={c}
                    role="Student"
                    onLeave={() => void leaveClass(c.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
