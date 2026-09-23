import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClass, useNotifications } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/classes", label: "My Classes" },
  { to: "/classes/new", label: "Create Class" },
  { to: "/classes/join", label: "Join Class" },
] as const;

function AuthenticatedLayout() {
  const { session, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const params = useParams({ strict: false }) as { classId?: string };
  const { data: currentClass } = useClass(params.classId);
  const { data: notifications } = useNotifications(session?.user?.id);
  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-sm text-mute">Loading your account…</span>
      </div>
    );
  }

  const initials = (profile?.full_name ?? profile?.email ?? "U").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-5">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              R
            </div>
            <span className="hidden text-[15px] font-semibold tracking-tight sm:block">Registrar</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-0.5 text-sm lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                className="rounded-md px-3 py-1.5 text-inksoft transition-colors hover:bg-secondary"
                activeProps={{ className: "bg-secondary font-medium text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative grid size-9 place-items-center rounded-md text-inksoft transition-colors hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="num absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-oxblood px-1 text-[10px] leading-4 text-paper">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              to="/profile"
              className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-inksoft transition-colors hover:bg-border"
              aria-label="Profile"
            >
              {initials}
            </Link>
            <button
              onClick={async () => {
                await signOut();
                void navigate({ to: "/auth", replace: true });
              }}
              className="hidden size-9 place-items-center rounded-md text-inksoft transition-colors hover:bg-secondary lg:grid"
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid size-9 place-items-center rounded-md text-inksoft transition-colors hover:bg-secondary lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-border bg-card px-5 py-3 lg:hidden">
            <nav className="grid gap-0.5 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-inksoft transition-colors hover:bg-secondary"
                  activeProps={{ className: "bg-secondary font-medium text-foreground" }}
                  activeOptions={{ exact: true }}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-inksoft transition-colors hover:bg-secondary"
              >
                Profile
              </Link>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                  void navigate({ to: "/auth", replace: true });
                }}
                className="rounded-md px-3 py-2 text-left text-destructive transition-colors hover:bg-secondary"
              >
                Logout
              </button>
            </nav>
          </div>
        ) : null}

        <div className={cn("border-t border-border bg-secondary/40", !currentClass && "hidden")}>
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-2 px-5 py-1.5 text-[11px]">
            <Link to="/classes" className="text-mute hover:text-foreground">
              My Classes
            </Link>
            <span className="text-mute">/</span>
            <span className="font-medium">{currentClass?.subject}</span>
            <span className="num text-mute">
              {currentClass?.section} · {currentClass?.semester} · {currentClass?.academic_year}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 py-6">
        <Outlet />
      </main>
    </div>
  );
}
