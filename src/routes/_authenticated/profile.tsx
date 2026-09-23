import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useMyClasses } from "@/lib/data";
import { LedgerButton, Panel, PanelHeader } from "@/components/ledger";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Registrar" },
      { name: "description", content: "Your Registrar account details and class memberships." },
      { property: "og:title", content: "Profile — Registrar" },
      { property: "og:description", content: "Your account details and class memberships." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, signOut } = useAuth();
  const { data } = useMyClasses(user?.id);
  const navigate = useNavigate();

  return (
    <div className="fade-up mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label-caps">Profile</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your account</h1>
      </div>
      <Panel>
        <PanelHeader title="Account" hint="Signed in with Google" />
        <div className="flex items-center gap-4 p-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="size-14 rounded-full ring-1 ring-border" />
          ) : (
            <div className="grid size-14 place-items-center rounded-full bg-secondary text-lg font-semibold text-inksoft">
              {(profile?.full_name ?? profile?.email ?? "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[15px] font-semibold tracking-tight">{profile?.full_name ?? "—"}</p>
            <p className="num text-sm text-mute">{profile?.email ?? user?.email}</p>
          </div>
        </div>
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">
          <div>
            <p className="label-caps">Classes you teach</p>
            <p className="num mt-1 text-xl">{data?.owned.length ?? 0}</p>
          </div>
          <div>
            <p className="label-caps">Classes you joined</p>
            <p className="num mt-1 text-xl">{data?.joined.length ?? 0}</p>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <LedgerButton
            variant="danger"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/auth", replace: true });
            }}
          >
            Logout
          </LedgerButton>
        </div>
      </Panel>
      <p className="text-[11px] text-mute">
        There is no permanent faculty or student role. Creating a class makes you its faculty;
        joining one with a code makes you a student of that class.
      </p>
    </div>
  );
}
