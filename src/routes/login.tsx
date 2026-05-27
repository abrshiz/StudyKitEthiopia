import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Mail, Phone, Lock, ShieldCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — StudyKit ET" }] }),
  component: Login,
});

const EDU_ET = /^.+@(.+\.)?(edu\.et|university\.edu\.et)$/;

function Login() {
  const [email, setEmail] = useState("");
  const [mfa, setMfa] = useState(false);
  const invalid = email.length > 4 && !EDU_ET.test(email);

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
          <p className="mt-3 text-primary-foreground/80 max-w-sm">
            Sign in with your university email to pick up where you left off — your notes, AI chats, and downloads
            sync across devices.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">
          Protected by .edu.et domain verification and optional multi-factor authentication.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-7">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your university credentials</p>

          <Tabs defaultValue="email" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1.5" />Email</TabsTrigger>
              <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-1.5" />Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-5 space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs">University email</Label>
                <Input
                  id="email" type="email" placeholder="you@aau.edu.et"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={invalid ? "border-destructive" : ""}
                />
                {invalid && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Must be a .edu.et address
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="pw" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="pw" type="password" placeholder="••••••••" className="pl-9" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="mt-5 space-y-4">
              <div>
                <Label htmlFor="phone" className="text-xs">Phone number</Label>
                <div className="flex gap-2">
                  <div className="px-3 flex items-center text-sm border rounded-md bg-muted">+251</div>
                  <Input id="phone" placeholder="9XX XXX XXX" inputMode="tel" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll text a 6-digit code. Phone sign-in still requires a verified .edu.et email on file.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <label className="flex items-center gap-2 mt-5 text-sm">
            <Checkbox checked={mfa} onCheckedChange={(v) => setMfa(!!v)} />
            <ShieldCheck className="h-4 w-4 text-primary" />
            Require multi-factor authentication
          </label>

          <Button className="w-full mt-6">Sign in</Button>

          <div className="mt-5 text-sm text-center text-muted-foreground">
            New here? <Link to="/register" className="text-primary font-medium">Create account</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
