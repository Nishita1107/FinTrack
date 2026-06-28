import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validation";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionCheckLoading, setSessionCheckLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        setHasSession(true);
        setSessionCheckLoading(false);
      }
    });

    // Listen to auth state changes (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY")) {
        setHasSession(true);
        setSessionCheckLoading(false);
      }
    });

    // Timeout fallback after 1.5 seconds if no session is detected
    const timeout = setTimeout(() => {
      if (!active) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          const isPlaceholder = import.meta.env.VITE_SUPABASE_ANON_KEY === "placeholder-anon-key";
          if (isPlaceholder || import.meta.env.DEV) {
            setHasSession(true);
            setIsPreview(true);
            toast.info("Entering Preview Mode: You can preview the reset password UI. Submission will be simulated.");
          } else {
            toast.error("Session expired or invalid reset link. Please request a new one.");
            navigate({ to: "/login" });
          }
        }
        setSessionCheckLoading(false);
      });
    }, 1500);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const showMatchFeedback = password.length > 0 && confirmPassword.length > 0;
  const isPasswordValid = passwordValidation.score === 5;
  const canSubmit = isPasswordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    if (isPreview) {
      setTimeout(async () => {
        toast.success("Password reset successful! (Simulated Preview)");
        setBusy(false);
        navigate({ to: "/login" });
      }, 1500);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset successful! Please log in with your new password.");
      await supabase.auth.signOut();
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  if (sessionCheckLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Checking session…
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong new password for your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              className="mt-1"
              placeholder="••••••••"
            />
            {password.length > 0 && (
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
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
        <div className="mt-6 border-t border-border pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/login" })}
            disabled={busy}
            className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
