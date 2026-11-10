import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notifyClass, useClass, useResources } from "@/lib/data";
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

export const Route = createFileRoute("/_authenticated/classes/$classId/resources")({
  head: () => ({
    meta: [
      { title: "Class resources — Registrar" },
      { name: "description", content: "Notes, slides and documents shared with this class." },
      { property: "og:title", content: "Class resources — Registrar" },
      {
        property: "og:description",
        content: "Notes, slides and documents shared with this class.",
      },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();
  const { data: cls } = useClass(classId);
  const { data: resources, isLoading } = useResources(classId);
  const queryClient = useQueryClient();
  const isOwner = cls?.owner_id === user?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    if (!title.trim() || !file) {
      toast.error("Add a title and choose a file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File must be under 25 MB.");
      return;
    }
    setBusy(true);
    const path = `${classId}/resources/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const up = await supabase.storage.from("class-resources").upload(path, file);
    if (up.error) {
      setBusy(false);
      toast.error(`Upload failed: ${up.error.message}`);
      return;
    }
    const { error } = await supabase.from("resources").insert({
      class_id: classId,
      title: title.trim(),
      description: description.trim() || null,
      file_path: path,
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from("class-resources").remove([path]);
      toast.error(error.message);
      return;
    }
    await notifyClass({
      classId,
      actorId: user!.id,
      kind: "resource",
      title: "New resource",
      body: `${cls?.subject ?? "Class"}: ${title.trim()}`,
    });
    setTitle("");
    setDescription("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Resource uploaded");
    await queryClient.invalidateQueries({ queryKey: ["resources", classId] });
  }

  async function download(path: string) {
    const { data, error } = await supabase.storage
      .from("class-resources")
      .createSignedUrl(path, 120);
    if (error || !data) {
      toast.error("Could not open the file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(id: string, path: string) {
    if (!isOwner) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("class-resources").remove([path]);
    toast.success("Resource removed");
    await queryClient.invalidateQueries({ queryKey: ["resources", classId] });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Panel>
        <PanelHeader
          title="Resources"
          hint={isOwner ? "Upload notes and documents" : "View and download"}
        />
        {isLoading ? (
          <Loading />
        ) : (resources ?? []).length === 0 ? (
          <EmptyState
            title="No resources yet"
            description={
              isOwner ? "Upload notes, slides or PDFs for this class." : "Nothing shared yet."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {(resources ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.description ? (
                    <p className="mt-0.5 text-[13px] text-mute">{r.description}</p>
                  ) : null}
                  <p className="num mt-1 text-[11px] text-mute">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <LedgerButton onClick={() => void download(r.file_path)}>Download</LedgerButton>
                  {isOwner ? (
                    <ConfirmButton
                      label="Delete"
                      message={`Delete "${r.title}"?`}
                      onConfirm={() => void remove(r.id, r.file_path)}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {isOwner ? (
        <Panel className="h-fit">
          <PanelHeader title="Upload resource" />
          <form onSubmit={upload} className="space-y-4 p-4">
            <TextField
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextArea
              label="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="block">
              <span className="label-caps block">File</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-[12px]"
              />
              <span className="mt-1 block text-[11px] text-mute">
                PDF, notes, documents or images (max 25 MB).
              </span>
            </label>
            <LedgerButton type="submit" variant="solid" disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </LedgerButton>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
