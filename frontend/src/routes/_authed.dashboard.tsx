import { createFileRoute, Link } from "@tanstack/react-router";
import { useExpenses } from "@/lib/use-expenses";
import { useBudgetFor } from "@/lib/use-expenses";
import { CATEGORIES, formatINR, CATEGORY_COLORS } from "@/lib/expense-constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
  Tag,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/dashboard")({ component: Dashboard });

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function Dashboard() {
  const { data: expenses = [], isLoading } = useExpenses();
  const now = new Date();
  const budget = useBudgetFor(now.getFullYear(), now.getMonth() + 1);

  const monthStart = startOfMonth();
  const thisMonth = expenses.filter((e) => new Date(e.expense_date) >= monthStart);
  const totalMonth = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = budget - totalMonth;
  const percent = Math.min(100, (totalMonth / budget) * 100);

  const byCat: Record<string, number> = {};
  thisMonth.forEach((e) => {
    byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
  });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const today = new Date().toISOString().slice(0, 10);
  const todaySpend = expenses
    .filter((e) => e.expense_date === today)
    .reduce((s, e) => s + Number(e.amount), 0);

  const recent = expenses.slice(0, 5);

  const tips = [
    "Track every chai — small purchases add up to big leaks.",
    "Use UPI history weekly to spot subscriptions you forgot.",
    "Aim to save at least 20% of your monthly allowance.",
    "Cook one meal a day instead of ordering — it adds up.",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track daily expenses and monitor your monthly spending.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link to="/add">
          <Button>+ Add Expense</Button>
        </Link>
      </div>

      {percent >= 90 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Budget warning</p>
            <p className="text-muted-foreground">
              You've used {percent.toFixed(0)}% of your monthly budget. Slow down on non-essentials.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Spent this month"
          value={formatINR(totalMonth)}
          accent="primary"
        />
        <StatCard icon={TrendingDown} label="Monthly budget" value={formatINR(budget)} />
        <StatCard
          icon={TrendingUp}
          label={remaining >= 0 ? "Savings remaining" : "Over budget"}
          value={formatINR(Math.abs(remaining))}
          accent={remaining >= 0 ? "success" : "destructive"}
        />
        <StatCard icon={Receipt} label="Total transactions" value={String(expenses.length)} />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Monthly spending progress</p>
          <p className="text-sm text-muted-foreground">
            {percent.toFixed(0)}% of {formatINR(budget)}
          </p>
        </div>
        <Progress value={percent} className="h-3" />
        <p className="mt-3 text-xs text-muted-foreground">
          All-time total: {formatINR(totalAll)} • Today: {formatINR(todaySpend)}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <p className="mb-3 text-sm font-semibold text-foreground">Recent transactions</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses yet.{" "}
              <Link to="/add" className="text-primary hover:underline">
                Add your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">
                      {e.category.slice(0, 2)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {e.description || e.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.expense_date} • {e.payment_method}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatINR(Number(e.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Tag className="h-4 w-4" /> Top category
          </p>
          {topCat ? (
            <>
              <p className="text-2xl font-semibold text-foreground">{topCat[0]}</p>
              <p className="text-sm text-muted-foreground">{formatINR(topCat[1])} this month</p>
              <div className="mt-4 space-y-2">
                {CATEGORIES.filter((c) => byCat[c])
                  .slice(0, 4)
                  .map((c) => (
                    <div key={c} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: CATEGORY_COLORS[c] }}
                        />
                        {c}
                      </span>
                      <span className="text-muted-foreground">{formatINR(byCat[c])}</span>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet this month.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="h-4 w-4" /> Financial tips
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {tips.map((t, i) => (
            <li
              key={i}
              className="rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground"
            >
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "primary" | "success" | "destructive";
}) {
  const accentClass =
    accent === "primary"
      ? "bg-primary/10 text-primary"
      : accent === "success"
        ? "bg-success/15 text-success"
        : accent === "destructive"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-secondary-foreground";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
