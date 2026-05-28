import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { isEduEtEmail } from "@/lib/validation/edu-et";
import {
  canUseLocalSessionOnly,
  checkMicrosoftStatus,
  loginWithApi,
  microsoftSignInUrl,
} from "@/lib/api/auth";
import { isApiConfigured, ApiError } from "@/lib/api/client";
import { GuardedPage } from "@/components/auth/guarded-page";
import { getPostLoginPath } from "@/lib/auth/routing";
import { detectRoleFromEmail, roleLabel } from "@/lib/auth/role-from-email";
import { useAuth } from "@/context/auth-context";
import { getSelectedDepartment } from "@/lib/session";
import {
  GraduationCap,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — StudyKit ET" }] }),
  component: Login,
});

function Login() {
  return (
    <GuardedPage guard={{ guestOnly: true }}>
      <LoginForm />
    </GuardedPage>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [microsoftReady, setMicrosoftReady] = useState(false);
  const invalid = email.length > 4 && !isEduEtEmail(email);

  useEffect(() => {
    if (!isApiConfigured()) return;
    void checkMicrosoftStatus()
      .then((s) => setMicrosoftReady(s.configured))
      .catch(() => setMicrosoftReady(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEduEtEmail(email)) {
      setError("Use a valid .edu.et university email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isApiConfigured()) {
        const user = await loginWithApi({ email, password });
        signIn(user, user.department ?? null);
        const dept = user.department ?? getSelectedDepartment();
        navigate({ to: getPostLoginPath(user, Boolean(dept)) });
      } else if (canUseLocalSessionOnly()) {
        const role = detectRoleFromEmail(email);
        const localUser = {
          name: email.split("@")[0]!.replace(/\./g, " "),
          email,
          role,
          roleLabel: roleLabel(role),
          approvalStatus: "approved" as const,
        };
        signIn(localUser);
        navigate({ to: getPostLoginPath(localUser, Boolean(getSelectedDepartment())) });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(err.message);
        return;
      }
      setError(err instanceof ApiError ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-foreground/15 grid place-items-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">StudyKit ET</span>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Welcome back.</h2>
          <p className="mt-3 text-primary-foreground/85 max-w-sm">
            Sign in with your university email. Session is kept in your browser — no tokens stored
            in the app.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/65">
          .edu.et verification · optional MFA when your API enables it
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-7 border-border/80 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-earth">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your university credentials</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <Tabs defaultValue="email">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="email" type="button">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" type="button" disabled>
                  <Phone className="h-4 w-4 mr-1.5" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs">
                    University email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@aau.edu.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={invalid ? "border-destructive" : ""}
                    required
                    autoComplete="email"
                  />
                  {invalid && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Must be a .edu.et address
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="pw" className="text-xs">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="pw"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-9 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <label className="flex items-center gap-2 mt-5 text-sm">
              <Checkbox checked={mfa} onCheckedChange={(v) => setMfa(!!v)} />
              <ShieldCheck className="h-4 w-4 text-primary" />
              Require multi-factor authentication
            </label>

            {error && (
              <p className="text-sm text-destructive mt-4 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={!microsoftReady}
            onClick={() => {
              window.location.href = microsoftSignInUrl();
            }}
          >
            <MicrosoftLogo />
            {microsoftReady ? "Continue with Microsoft" : "Microsoft sign-in not configured"}
          </Button>

          <div className="mt-5 text-sm text-center text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="text-primary font-medium">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
