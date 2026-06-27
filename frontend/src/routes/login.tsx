import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("confirm") || error.message.toLowerCase().includes("verify")) {
          toast.error("Please verify your email address. Check your inbox for the confirmation link.", {
            duration: 6000,
          });
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset email sent! Please check your inbox.");
      setView("login");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {view === "login" ? (
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 animate-fade-in">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-semibold text-foreground animate-fade-in">FinTrack</h1>
            <p className="mt-1 text-sm text-muted-foreground animate-fade-in">Login to your account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                className="mt-1"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setView("forgot");
                  }}
                  disabled={busy}
                  className="p-0 h-auto font-medium text-xs text-primary hover:underline hover:text-primary/80 cursor-pointer"
                >
                  Forgot Password?
                </Button>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full cursor-pointer flex items-center justify-center">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Tip: you can use a sample email like <code>student@test.com</code> to try it out.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 animate-fade-in">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={busy}
                className="mt-1"
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full cursor-pointer flex items-center justify-center">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("login")}
              disabled={busy}
              className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
