import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, LogOut, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/omnilens/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Profile — OmniLens AI";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: TITLE }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    job_title: "",
    organization: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, job_title, organization")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfile({
            display_name: data.display_name || "",
            job_title: data.job_title || "",
            organization: data.organization || "",
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (user) void loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          job_title: profile.job_title,
          organization: profile.organization,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) return null;

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : (user.email?.slice(0, 2).toUpperCase() ?? "??");

  return (
    <main className="flex min-h-screen flex-col gap-3 p-3 lg:p-4">
      <AppHeader />

      <div className="mx-auto w-full max-w-2xl space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
          <Button variant="outline" size="sm" asChild>
            <Link to="/activity">
              <BarChart3 className="size-4" />
              Activity & Stats
            </Link>
          </Button>
        </div>

        <div className="glass rounded-2xl p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-5">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-2xl font-bold text-primary">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.display_name || "User"}</h2>
              <p className="label-mono">{user.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4 pt-4 border-t border-glass-border">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="label-mono">
                Display name
              </Label>
              <Input
                id="displayName"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="label-mono">
                Email
              </Label>
              <Input
                id="email"
                value={user.email ?? ""}
                disabled
                className="text-muted-foreground"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle" className="label-mono">
                  Job title
                </Label>
                <Input
                  id="jobTitle"
                  value={profile.job_title}
                  onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="label-mono">
                  Organization
                </Label>
                <Input
                  id="organization"
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border">
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
