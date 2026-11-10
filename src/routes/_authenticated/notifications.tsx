import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/data";
import { EmptyState, LedgerButton, Loading, Panel, PanelHeader } from "@/components/ledger";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Registrar" },
      {
        name: "description",
        content: "New notices, resources, assessments, marks and attendance updates.",
      },
      { property: "og:title", content: "Notifications — Registrar" },
      { property: "og:description", content: "Updates from the classes you joined." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const { data, isLoading } = useNotifications(user?.id);
  const queryClient = useQueryClient();
  const rows = data ?? [];
  const unread = rows.filter((n) => !n.read_at);

  async function markAllRead() {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <p className="label-caps">Notifications</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {unread.length ? `${unread.length} unread` : "All caught up"}
        </h1>
      </div>
      <Panel>
        <PanelHeader
          title="Recent updates"
          hint={`${rows.length} total`}
          actions={
            unread.length ? (
              <LedgerButton onClick={() => void markAllRead()}>Mark all read</LedgerButton>
            ) : null
          }
        />
        {isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You'll be notified when a class posts a notice, resource, assessment, marks or attendance."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((n) => (
              <li key={n.id} className={cn("px-4 py-3", !n.read_at && "bg-secondary/40")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {!n.read_at ? <span className="size-1.5 rounded-full bg-oxblood" /> : null}
                      <p className="text-sm font-medium">{n.title}</p>
                    </div>
                    {n.body ? <p className="mt-0.5 text-[13px] text-mute">{n.body}</p> : null}
                    {n.class_id ? (
                      <Link
                        to="/classes/$classId"
                        params={{ classId: n.class_id }}
                        className="mt-1 inline-block text-[12px] text-oxblood hover:underline"
                      >
                        Open class →
                      </Link>
                    ) : null}
                  </div>
                  <span className="num shrink-0 text-[11px] text-mute">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
