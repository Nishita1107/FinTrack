import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, Check, X, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password-validation";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const showMatchFeedback = password.length > 0 && confirmPassword.length > 0;
  const isPasswordValid = passwordValidation.score === 5;
  const canSubmit =
    isPasswordValid && passwordsMatch && name.trim().length > 0 && email.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      return toast.error("Please ensure your password meets all strength requirements.");
    }
    if (!passwordsMatch) {
      return toast.error("Passwords do not match.");
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: name },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user && !data.session) {
        setVerificationSent(true);
        toast.success("Verification email sent! Please confirm your email.");
      } else {
        toast.success("Account created!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account.");
    } finally {
      setBusy(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center animate-fade-in">
          <span className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
            <Mail className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-semibold text-foreground">Verify your email</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We have sent a verification link to <strong className="text-foreground">{email}</strong>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Please check your inbox (and spam folder) and click the link to activate your FinTrack
            account.
          </p>
          <div className="mt-6 border-t border-border pt-6">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/login" })}
              className="w-full cursor-pointer flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold text-foreground">Register</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an account to start tracking expenses
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
              className="mt-1"
              placeholder="John Doe"
            />
          </div>
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
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirm-password">Confirm Password</Label>
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
                Creating…
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
