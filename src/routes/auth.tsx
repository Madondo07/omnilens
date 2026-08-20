import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Aperture, ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Sign in — OmniLens AI Workbench";
const DESC =
  "Sign in to OmniLens AI to upload project sources, resolve contradictions and generate lens-specific executive posters.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: AuthPage,
});

type View = "form" | "check-email" | "forgot" | "reset-sent" | "update-password";

function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("form");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/workbench" });
    });
  }, [navigate]);

  // A password-recovery link lands back on this page with a recovery session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setView("update-password");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void navigate({ to: "/workbench" });
  }

  async function signUp() {
    setBusy(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/workbench`,
        data: { display_name: name || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — signing you in.");
      void navigate({ to: "/workbench" });
      return;
    }
    // No session back means the project requires email confirmation first.
    setPendingEmail(email);
    setView("check-email");
  }

  async function resendConfirmation() {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Confirmation email resent.");
  }

  async function google() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/workbench` },
    });
    // On success Supabase redirects the browser to Google immediately — nothing left to do here.
    if (error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
    }
  }

  async function sendResetLink() {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPendingEmail(email);
    setView("reset-sent");
  }

  async function updatePassword() {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    void navigate({ to: "/workbench" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="glass-soft flex size-9 items-center justify-center rounded-xl">
            <Aperture className="size-5 text-primary" />
          </span>
          <span className="text-lg font-semibold tracking-tight">OmniLens AI</span>
        </Link>

        <div className="glass rounded-2xl p-6">
          {view === "check-email" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">{pendingEmail}</span>. Click it to
                  activate your account, then come back and sign in.
                </p>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => void resendConfirmation()}
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Resend email
              </Button>
              <button
                onClick={() => setView("form")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {view === "forgot" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we'll send a link to reset your password.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={busy || !email}
                onClick={() => void sendResetLink()}
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Send reset link
              </Button>
              <button
                onClick={() => setView("form")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {view === "reset-sent" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Reset link sent</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check <span className="font-medium text-foreground">{pendingEmail}</span> for a
                  link to set a new password.
                </p>
              </div>
              <button
                onClick={() => setView("form")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
            </div>
          )}

          {view === "update-password" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a new password for your account.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={busy || newPassword.length < 6}
                onClick={() => void updatePassword()}
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Update password
              </Button>
            </div>
          )}

          {view === "form" && (
            <>
              <h1 className="text-xl font-semibold tracking-tight">Enter the workbench</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your sources, conflicts and generated artifacts stay tied to your account.
              </p>

              <Button
                variant="secondary"
                className="mt-5 w-full"
                disabled={busy}
                onClick={() => void google()}
              >
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="label-mono">or email</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={busy || !email || !password}
                    onClick={() => void signIn()}
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />} Sign in
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-up">Password</Label>
                    <Input
                      id="password-up"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={busy || !email || password.length < 6}
                    onClick={() => void signUp()}
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />} Create account
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
