import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { isEduEtEmail } from "@/lib/validation/edu-et";
import { registerWithApi, canUseLocalSessionOnly } from "@/lib/api/auth";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { GuardedPage } from "@/components/auth/guarded-page";
import { useAuth } from "@/context/auth-context";
import { getPostLoginPath } from "@/lib/auth/routing";
import { getSelectedDepartment } from "@/lib/session";
import { GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";

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
        const dept = user.department ?? getSelectedDepartment();
        navigate({ to: getPostLoginPath(user, Boolean(dept)) });
      } else if (canUseLocalSessionOnly()) {
        const localUser = {
          name: name.trim(),
          email,
          role: "student" as const,
        };
        signIn(localUser);
        navigate({ to: getPostLoginPath(localUser, Boolean(getSelectedDepartment())) });
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
          Only <strong>.edu.et</strong> addresses. Your account is ready to use the moment you
          sign up — no approval queue.
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
            {ok && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-primary" /> Instant access — no approval
                queue.
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
            {loading ? "Creating account…" : "Create account"}
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
