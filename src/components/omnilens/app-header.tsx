import { Link, useNavigate } from "@tanstack/react-router";
import { Aperture, LayoutDashboard, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/omnilens/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import type { ReactNode } from "react";

export function AppHeader({ extras }: { extras?: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="glass-soft flex size-9 items-center justify-center rounded-xl">
            <Aperture className="size-5 text-primary" />
          </span>
          <div>
            <p className="text-base font-semibold leading-tight tracking-tight">OmniLens AI</p>
            <p className="label-mono">Project intelligence workbench</p>
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {extras}
        {user ? (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/workbench">
                <LayoutDashboard className="size-4" /> Workbench
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile">
                <User className="size-4" />
                <span className="max-w-28 truncate">
                  {profile?.display_name ?? user.email?.split("@")[0]}
                </span>
              </Link>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                void signOut().then(() => navigate({ to: "/" }));
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
