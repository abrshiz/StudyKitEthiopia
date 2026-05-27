import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — StudyKit ET" }] }),
  component: Register,
});

const EDU_ET = /^.+@(.+\.)?(edu\.et|university\.edu\.et)$/;

function Register() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const ok = EDU_ET.test(email);
  const invalid = email.length > 4 && !ok;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-lg p-7">
        <Link to="/" className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold">StudyKit ET</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only students, professors, and admins from Ethiopian universities.</p>

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input placeholder="Selam Abebe" />
          </div>
          <div>
            <Label className="text-xs">Phone (+251)</Label>
            <Input placeholder="9XX XXX XXX" inputMode="tel" />
          </div>
        </div>

        <div className="mt-3">
          <Label className="text-xs">University email</Label>
          <Input
            type="email" placeholder="you@aau.edu.et"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={invalid ? "border-destructive" : ok ? "border-primary" : ""}
          />
          {invalid && (
            <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Domain must end in .edu.et
            </p>
          )}
          {ok && (
            <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified domain
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-xs">Password</Label>
            <Input type="password" placeholder="At least 8 characters" />
          </div>
          <div>
            <Label className="text-xs">Confirm password</Label>
            <Input type="password" placeholder="Repeat password" />
          </div>
        </div>

        <div className="mt-5">
          <Label className="text-xs">I am a…</Label>
          <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-3 gap-2 mt-2">
            {[
              { v: "student", l: "Student" },
              { v: "professor", l: "Professor" },
              { v: "admin", l: "Admin" },
            ].map((r) => (
              <label
                key={r.v}
                className={`border rounded-lg px-3 py-2.5 text-sm cursor-pointer flex items-center gap-2 ${
                  role === r.v ? "border-primary bg-accent/40" : ""
                }`}
              >
                <RadioGroupItem value={r.v} />
                {r.l}
              </label>
            ))}
          </RadioGroup>
        </div>

        <Link to="/departments"><Button className="w-full mt-6">Continue to department selection</Button></Link>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
