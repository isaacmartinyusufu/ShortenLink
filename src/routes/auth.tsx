import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Scissors } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Scissor" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (res.error) {
      toast.error(res.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-grid">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center gap-2 mb-6 font-semibold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Scissors className="w-4 h-4" />
          </span>
          Scissor
        </a>
        <Card className="p-6 shadow-card">
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${mode === "signin" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${mode === "signup" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="relative my-5">
            <Separator />
            <span className="absolute inset-0 -top-2.5 grid place-items-center">
              <span className="bg-card text-xs text-muted-foreground px-2">or</span>
            </span>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </Button>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
