import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Login | Lunaray Studio" },
      { name: "description", content: "Studio owner sign-in for Lunaray Studio." },
      { property: "og:title", content: "Studio Login | Lunaray Studio" },
      { property: "og:description", content: "Studio owner sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    setBusy(true);
    setMsg(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: error.message });
      navigate({ to: "/admin", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) return setMsg({ type: "error", text: error.message });
      setMsg({ type: "info", text: "Check your email to confirm your account, then sign in." });
      setMode("signin");
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-secondary/60 px-5 pt-24">
      <div className="w-full max-w-md border border-border bg-card p-8 md:p-10">
        <p className="eyebrow text-primary">Studio</p>
        <h1 className="mt-3 font-serif text-4xl text-forest">{mode === "signin" ? "Sign in" : "Create owner account"}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" className="mt-2 h-11" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} className="mt-2 h-11" />
          </div>
          {msg && <p className={msg.type === "error" ? "text-sm text-destructive" : "text-sm text-primary"} role="alert">{msg.text}</p>}
          <Button type="submit" variant="brand" size="xl" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline">
          {mode === "signin" ? "First time? Create the owner account" : "Already have an account? Sign in"}
        </button>
      </div>
    </section>
  );
}
