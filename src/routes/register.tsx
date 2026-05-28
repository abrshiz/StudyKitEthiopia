import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { isEduEtEmail } from "@/lib/validation/edu-et";
import { describeRoleFromEmail } from "@/lib/auth/role-from-email";
import { registerWithApi, canUseLocalSessionOnly } from "@/lib/api/auth";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useAuth } from "@/context/auth-context";
import { GraduationCap, AlertCircle, CheckCircle2, Shield } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — StudyKit ET" }] }),
  component: Register,
});

function Register() {
  return (
    <GuardedPage guard={{ guestOnly: true }}>
      <RegisterForm />
    </GuardedPage>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ok = isEduEtEmail(email);
  const invalid = email.length > 4 && !ok;
  const detectedRole = ok ? describeRoleFromEmail(email) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!isEduEtEmail(email)) {
      setError("Only Ethiopian university emails (.edu.et) are allowed.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isApiConfigured()) {
        const user = await registerWithApi({ name: name.trim(), email, password });
        signIn(user, user.department ?? null);
        navigate({ to: "/pending-approval" });
      } else if (canUseLocalSessionOnly()) {
        signIn({
          name: name.trim(),
          email,
          role: "student",
          approvalStatus: "pending",
        });
        navigate({ to: "/pending-approval" });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-lg p-7 border-border/80 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold text-earth">StudyKit ET</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Register with university email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only <strong>.edu.et</strong> addresses. Your role (student, lecturer, or admin) is
          detected automatically — an administrator must approve your account before you can use the
          app.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <Label className="text-xs">University email</Label>
            <Input
              type="email"
              placeholder="you@aau.edu.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={invalid ? "border-destructive" : ok ? "border-primary/50" : ""}
              required
              autoComplete="email"
            />
            {invalid && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Must end in .edu.et
              </p>
            )}
            {detectedRole && (
              <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                System will register you as: <strong>{detectedRole}</strong>
              </p>
            )}
            {ok && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" /> Admin approval required after
                sign-up
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label className="text-xs">Confirm password</Label>
              <Input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full mt-3" disabled={loading}>
            {loading ? "Submitting…" : "Submit for approval"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
