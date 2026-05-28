import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Shield,
  Wifi,
  Languages,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyKit ET — AI Study Kit for Ethiopian University Students" },
      {
        name: "description",
        content:
          "Curated materials, AI tutor, and offline study tools for 231 university departments. Built for Ethiopia.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight text-earth">StudyKit ET</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#departments" className="hover:text-foreground">
              Departments
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <Link to="/status" className="hover:text-foreground">
              Status
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-accent)_0%,transparent_60%)] opacity-40" />
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built for 231 Ethiopian university departments
          </Badge>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mx-auto text-earth dark:text-foreground">
            Your AI study kit, tuned for <span className="text-primary">Ethiopian</span>{" "}
            universities.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Curated lecture notes, an AI tutor that reads your course materials, and offline-first
            tools that work on every Ethiopian network. From Addis to Mekelle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start free with .edu.et email <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                Open dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> .edu.et verified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> TeleBirr · Chapa · CBE Birr
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Amharic & English
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="h-10 w-10 rounded-lg bg-accent/40 grid place-items-center text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="max-w-6xl mx-auto px-5 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">231 departments. One study kit.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          From Medicine to Software Engineering to Afaan Oromo Literature — pick your department and
          we tune your library.
        </p>
        <div className="mt-6">
          <Link to="/departments">
            <Button variant="outline">Browse departments</Button>
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight text-center">
          Affordable for students
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Pay with TeleBirr, Chapa, or CBE Birr. Cancel any time.
        </p>
        <div className="mt-8 text-center">
          <Link to="/billing">
            <Button>See plans</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 StudyKit ET · Made in Addis Ababa</span>
          <span className="flex gap-3">
            <Link to="/status" className="hover:text-foreground">
              Platform status
            </Link>
            <span>Privacy · Terms</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: BookOpen,
    title: "Curated by semester",
    desc: "Lecture notes, slides, and past exams organized by year and semester for your exact department.",
  },
  {
    icon: Sparkles,
    title: "AI tutor with context",
    desc: "Ask questions about your uploaded PDFs. The assistant grounds answers in your course materials.",
  },
  {
    icon: Wifi,
    title: "Offline & low-data",
    desc: "Download once, study anywhere. Toggle low-data mode to compress images and prefer text.",
  },
  {
    icon: Shield,
    title: "Private & secure",
    desc: "Your uploads stay private until you flip a kit to public — the shared library only sees what you publish.",
  },
  {
    icon: Languages,
    title: "Amharic & English",
    desc: "Switch the UI between Amharic and English with a single tap.",
  },
  {
    icon: Smartphone,
    title: "Android-first",
    desc: "Background downloads, biometric unlock, push notifications when new materials drop.",
  },
];
