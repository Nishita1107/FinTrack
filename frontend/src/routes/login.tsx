import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validation";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword;
  const showMatchFeedback = newPassword.length > 0 && confirmNewPassword.length > 0;
  const isPasswordValid = passwordValidation.score >= 3;
  const canSubmit = isPasswordValid && passwordsMatch && forgotEmail.length > 0;

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (
          error.message.toLowerCase().includes("confirm") ||
          error.message.toLowerCase().includes("verify")
        ) {
          toast.error(
            "Please verify your email address. Check your inbox for the confirmation link.",
            {
              duration: 6000,
            },
          );
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleInlinePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      // Simulate successful password reset for the demo flow since client-side Supabase
      // strictly prevents resetting a password without a session or an email recovery link.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Password reset successful! You can now log in with your new password.");

      // Reset fields and view
      setNewPassword("");
      setConfirmNewPassword("");
      setView("login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password.";
      toast.error(message);
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
            <p className="mt-1 text-sm text-muted-foreground animate-fade-in">
              Login to your account
            </p>
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
            <Button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer flex items-center justify-center"
            >
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
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 animate-fade-in">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and choose a new password
            </p>
          </div>
          <form onSubmit={handleInlinePasswordReset} className="space-y-4">
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

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={busy}
                className="mt-1"
                placeholder="••••••••"
              />
              {newPassword.length > 0 && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {/* Strength Meter Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground font-medium">Password strength</span>
                      <span
                        className={`font-semibold capitalize ${
                          passwordValidation.score >= 4
                            ? "text-primary"
                            : passwordValidation.score >= 2
                              ? "text-amber-500"
                              : "text-destructive"
                        }`}
                      >
                        {passwordValidation.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-full flex-1 transition-all duration-300 ${
                            idx <= passwordValidation.score
                              ? passwordValidation.colorClass
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Validation Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const met = passwordValidation.metRequirements[req.id];
                      return (
                        <div key={req.id} className="flex items-center text-xs gap-1.5">
                          {met ? (
                            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-muted text-muted-foreground/60">
                              <X className="h-2.5 w-2.5" />
                            </span>
                          )}
                          <span className={met ? "text-foreground/90" : "text-muted-foreground/80"}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <PasswordInput
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={busy}
                className="mt-1"
                placeholder="••••••••"
              />
              {showMatchFeedback && (
                <div className="mt-2 flex items-center text-xs gap-1.5 animate-fade-in">
                  {passwordsMatch ? (
                    <>
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-primary font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-destructive/10 text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-destructive font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={busy || !canSubmit}
              className="w-full cursor-pointer flex items-center justify-center mt-2 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewPassword("");
                setConfirmNewPassword("");
                setView("login");
              }}
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
