import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notifyClass, useClass, useNotices } from "@/lib/data";
import {
  ConfirmButton,
  EmptyState,
  LedgerButton,
  Loading,
  Panel,
  PanelHeader,
  TextArea,
  TextField,
} from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/classes/$classId/notices")({
  head: () => ({
    meta: [
      { title: "Class notices — Registrar" },
      { name: "description", content: "Announcements posted by the faculty of this class." },
      { property: "og:title", content: "Class notices — Registrar" },
      { property: "og:description", content: "Announcements posted by the faculty of this class." },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: notices, isLoading } = useNotices(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    if (!title.trim()) {
      toast.error("A notice needs a title.");
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      toast.error("Attachment must be under 25 MB.");
      return;
    }
    setBusy(true);
    let attachmentPath: string | null = null;
    if (file) {
      const path = `${classId}/notices/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage.from("class-resources").upload(path, file);
      if (error) {
        setBusy(false);
        toast.error(`Attachment upload failed: ${error.message}`);
        return;
      }
      attachmentPath = path;
    }

    if (editingId) {
      const previousPath = (notices ?? []).find((n) => n.id === editingId)?.attachment_path ?? null;
      const { error } = await supabase
        .from("notices")
        .update(
          attachmentPath
            ? { title: title.trim(), body: body.trim() || null, attachment_path: attachmentPath }
            : { title: title.trim(), body: body.trim() || null },
        )
        .eq("id", editingId);
      setBusy(false);
      if (error) {
        if (attachmentPath) await supabase.storage.from("class-resources").remove([attachmentPath]);
        toast.error(error.message);
        return;
      }
      if (attachmentPath && previousPath && previousPath !== attachmentPath) {
        await supabase.storage.from("class-resources").remove([previousPath]);
      }
      toast.success("Notice updated");
    } else {
      const { error } = await supabase.from("notices").insert({
        class_id: classId,
        author_id: user!.id,
        title: title.trim(),
        body: body.trim() || null,
        attachment_path: attachmentPath,
      });
      setBusy(false);
      if (error) {
        if (attachmentPath) await supabase.storage.from("class-resources").remove([attachmentPath]);
        toast.error(error.message);
        return;
      }
      await notifyClass({
        classId,
        actorId: user!.id,
        kind: "notice",
        title: "New notice",
        body: `${cls?.subject ?? "Class"}: ${title.trim()}`,
      });
      toast.success("Notice posted");
    }
    resetForm();
    await queryClient.invalidateQueries({ queryKey: ["notices", classId] });
  }

  async function remove(id: string, attachmentPath: string | null) {
    if (!isOwner) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (attachmentPath) {
      await supabase.storage.from("class-resources").remove([attachmentPath]);
    }
    toast.success("Notice deleted");
    await queryClient.invalidateQueries({ queryKey: ["notices", classId] });
  }

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage
      .from("class-resources")
      .createSignedUrl(path, 120);
    if (error || !data) {
      toast.error("Could not open the attachment.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Panel>
        <PanelHeader
          title="Notices"
          hint={isOwner ? "You can post, edit and delete" : "Read only"}
        />
        {isLoading ? (
          <Loading />
        ) : (notices ?? []).length === 0 ? (
          <EmptyState
            title="No notices yet"
            description={isOwner ? "Post the first notice for this class." : "Nothing posted yet."}
          />
        ) : (
          <ul className="divide-y divide-border">
            {(notices ?? []).map((n) => (
              <li key={n.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight">{n.title}</p>
                    {n.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-[13px] text-inksoft">{n.body}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="num text-[11px] text-mute">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.attachment_path ? (
                        <button
                          type="button"
                          onClick={() => void openAttachment(n.attachment_path!)}
                          className="text-[12px] text-oxblood hover:underline"
                        >
                          Open attachment
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {isOwner ? (
                    <div className="flex gap-2">
                      <LedgerButton
                        onClick={() => {
                          setEditingId(n.id);
                          setTitle(n.title);
                          setBody(n.body ?? "");
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Edit
                      </LedgerButton>
                      <ConfirmButton
                        label="Delete"
                        message={`Delete the notice "${n.title}"?`}
                        onConfirm={() => void remove(n.id, n.attachment_path)}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {isOwner ? (
        <Panel className="h-fit">
          <PanelHeader title={editingId ? "Edit notice" : "New notice"} />
          <form onSubmit={save} className="space-y-4 p-4">
            <TextField
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextArea
              label="Description"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <label className="block">
              <span className="label-caps block">Attachment (optional)</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-[12px]"
              />
            </label>
            <div className="flex gap-2">
              <LedgerButton type="submit" variant="solid" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Post notice"}
              </LedgerButton>
              {editingId ? (
                <LedgerButton type="button" onClick={resetForm}>
                  Cancel
                </LedgerButton>
              ) : null}
            </div>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
