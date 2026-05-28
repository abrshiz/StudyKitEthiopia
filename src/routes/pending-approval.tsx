import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiLoading } from "@/components/shared/api-state";
import { Clock, GraduationCap, Mail } from "lucide-react";
import { resolveUserRole, roleLabel } from "@/lib/auth/role-from-email";
import { getUser } from "@/lib/session";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({ meta: [{ title: "Pending approval — StudyKit ET" }] }),
  component: PendingApproval,
});

function PendingApproval() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getUser();
    if (!session) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (session.approvalStatus === "approved") {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (session.approvalStatus === "rejected") {
      navigate({ to: "/login", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/40">
        <ApiLoading label="Checking account status" />
      </div>
    );
  }

  const detected = user.roleLabel ?? roleLabel(resolveUserRole(user));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Waiting for approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your university email was verified. An administrator must approve your account before you
          can sign in.
        </p>

        <div className="mt-6 text-left space-y-2 rounded-lg border p-4 bg-muted/30 text-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <Badge variant="secondary" className="mt-1">
            Detected role: {detected}
          </Badge>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Role is assigned automatically from your email. You cannot change it manually.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              signOut();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
