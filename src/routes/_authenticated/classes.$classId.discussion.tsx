import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useClass, useComments } from "@/lib/data";
import { ConfirmButton, EmptyState, LedgerButton, Loading, Panel, PanelHeader } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/discussion")({
  head: () => ({
    meta: [
      { title: "Class discussion — Registrar" },
      { name: "description", content: "Ask questions and reply within this class." },
      { property: "og:title", content: "Class discussion — Registrar" },
      { property: "og:description", content: "Ask questions and reply within this class." },
    ],
  }),
  component: DiscussionPage,
});

function DiscussionPage() {
  const { classId } = Route.useParams();
  const { user, profile } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: comments, isLoading } = useComments(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("comments").insert({
      class_id: classId,
      notice_id: null,
      author_id: user!.id,
      author_name: profile?.full_name ?? profile?.email ?? "Member",
      body: body.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    await queryClient.invalidateQueries({ queryKey: ["comments", classId] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comment removed");
    await queryClient.invalidateQueries({ queryKey: ["comments", classId] });
  }

  return (
    <Panel>
      <PanelHeader
        title="Discussion"
        hint={isOwner ? "You can reply and remove comments" : "Post questions for your faculty"}
      />
      {isLoading ? (
        <Loading />
      ) : (comments ?? []).length === 0 ? (
        <EmptyState title="No messages yet" description="Start the conversation for this class." />
      ) : (
        <ul className="divide-y divide-border">
          {(comments ?? []).map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{c.author_name ?? "Member"}</p>
                  {c.author_id === cls?.owner_id ? (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-inksoft">
                      Faculty
                    </span>
                  ) : null}
                  <span className="num text-[11px] text-mute">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-inksoft">{c.body}</p>
              </div>
              {isOwner || c.author_id === user?.id ? (
                <ConfirmButton
                  label="Remove"
                  message="Remove this comment?"
                  onConfirm={() => void remove(c.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={post} className="flex flex-wrap items-end gap-2 border-t border-border p-4">
        <label className="min-w-0 flex-1">
          <span className="label-caps block">Your message</span>
          <textarea
            value={body}
            rows={2}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a question or reply…"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <LedgerButton type="submit" variant="solid" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Post"}
        </LedgerButton>
      </form>
    </Panel>
  );
}
