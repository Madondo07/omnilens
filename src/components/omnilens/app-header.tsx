import { Link, useNavigate } from "@tanstack/react-router";
import { Aperture, BarChart3, LogOut, Moon, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/omnilens/theme-toggle";
import { useAuth } from "@/lib/use-auth";
import type { ReactNode } from "react";

export function AppHeader({ extras }: { extras?: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "Account";
  const initials = (profile?.display_name || user?.email || "??").slice(0, 2).toUpperCase();

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
              <Link to="/activity">
                <BarChart3 className="size-4" /> Activity
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="glass-soft flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-accent/40">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-28 truncate text-sm font-medium">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="size-4" /> Profile & settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleTheme();
                  }}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    void signOut().then(() => navigate({ to: "/" }));
                  }}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
