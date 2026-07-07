import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useProfile, useMonthlyBudgets, useSetMonthlyBudget } from "@/lib/use-expenses";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, CalendarRange, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/expense-constants";

export const Route = createFileRoute("/_authed/profile")({ component: Profile });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Profile() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: monthlyBudgets = [] } = useMonthlyBudgets();
  const setMonthly = useSetMonthlyBudget();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);


  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const defaultBudget = Number(profile?.monthly_budget ?? 10000);

  const rows = useMemo(
    () =>
      MONTHS.map((m, i) => {
        const found = monthlyBudgets.find((b) => b.year === year && b.month === i + 1);
        return {
          month: i + 1,
          label: m,
          budget: Number(found?.budget ?? defaultBudget),
          isOverride: !!found,
        };
      }),
    [monthlyBudgets, year, defaultBudget],
  );

  const [drafts, setDrafts] = useState<Record<number, string>>({});
  useEffect(() => {
    const next: Record<number, string> = {};
    rows.forEach((r) => {
      next[r.month] = String(r.budget);
    });
    setDrafts(next);
  }, [year, monthlyBudgets, defaultBudget]); // eslint-disable-line

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setBudget(String(profile.monthly_budget ?? 10000));
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const isMock = localStorage.getItem("mock-user-session") !== null;
    let errorObj = null;
    if (isMock) {
      const mockProfile = {
        id: user!.id,
        full_name: name,
        monthly_budget: Number(budget),
      };
      localStorage.setItem("mock-profile", JSON.stringify(mockProfile));
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          monthly_budget: Number(budget),
        })
        .eq("id", user!.id);
      errorObj = error;
    }
    setBusy(false);
    if (errorObj) return toast.error(errorObj.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const saveMonth = async (month: number) => {
    const value = Number(drafts[month]);
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter a valid budget");
    try {
      await setMonthly.mutateAsync({ year, month, budget: value });
      toast.success(`${MONTHS[month - 1]} ${year} budget saved`);
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your details and monthly budgets</p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </span>
          <div>
            <p className="font-medium text-foreground">{name || "Student"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="budget">Default monthly budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used for any month without a custom budget below.
            </p>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Monthly budgets — {year}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
              ‹
            </Button>
            <span className="text-sm font-medium text-foreground">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
              ›
            </Button>
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Set a custom budget for each month. Leave as default to inherit your profile budget (
          {formatINR(defaultBudget)}).
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.month}
              className="flex items-center gap-2 rounded-lg border border-border p-2"
            >
              <span className="w-10 text-sm font-medium text-foreground">{r.label}</span>
              <Input
                type="number"
                min="0"
                value={drafts[r.month] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.month]: e.target.value }))}
                className="h-8"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => saveMonth(r.month)}
                disabled={setMonthly.isPending}
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
