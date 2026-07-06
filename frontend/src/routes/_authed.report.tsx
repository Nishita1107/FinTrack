import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useExpenses, useProfile, useMonthlyBudgets } from "@/lib/use-expenses";
import { queryAIAssistant } from "@/lib/ai-service";
import { CATEGORIES, formatINR } from "@/lib/expense-constants";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/lib/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  Tag,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/_authed/report")({
  component: AIReportPage,
});

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function AIReportPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: expenses = [] } = useExpenses();
  const { data: profile } = useProfile();
  const { data: budgets = [] } = useMonthlyBudgets();

  const defaultBudget = Number(profile?.monthly_budget ?? 10000);

  // 1. Calculate stats locally for the selected month/year
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const budgetOverride = budgets.find(
    (b) => Number(b.year) === selectedYear && Number(b.month) === selectedMonth,
  );
  const activeBudget = budgetOverride ? Number(budgetOverride.budget) : defaultBudget;

  const savings = activeBudget - totalSpent;
  const percentSpent = activeBudget > 0 ? Math.min(100, (totalSpent / activeBudget) * 100) : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  // Largest transaction
  const largestTransaction = monthExpenses.reduce(
    (max, e) => (Number(e.amount) > (max ? Number(max.amount) : 0) ? e : max),
    null as (typeof expenses)[0] | null,
  );

  // Hash of expenses to invalidate query when data changes
  const dataHash = `${expenses.length}-${expenses[0]?.id || ""}-${activeBudget}`;

  // 2. Fetch AI Advice
  const {
    data: reportText,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai-report", selectedYear, selectedMonth, dataHash],
    queryFn: () =>
      queryAIAssistant({
        action: "report",
        year: selectedYear,
        month: selectedMonth,
      }),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 1,
  });

  // Range of years for dropdown
  const years = [selectedYear - 1, selectedYear, selectedYear + 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <div className="space-y-6">
      {/* Header and Selectors */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Monthly AI Report</h1>
          <p className="text-sm text-muted-foreground">
            View detailed stats and personalized AI advice for any month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Calendar className="h-4 w-4" />
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Wallet} label="Monthly Budget" value={formatINR(activeBudget)} />
        <StatCard
          icon={TrendingDown}
          label="Total Spent"
          value={formatINR(totalSpent)}
          accent={totalSpent > activeBudget ? "destructive" : "primary"}
        />
        <StatCard
          icon={TrendingUp}
          label={savings >= 0 ? "Saved" : "Overdraft"}
          value={formatINR(Math.abs(savings))}
          accent={savings >= 0 ? "success" : "destructive"}
        />
        <StatCard
          icon={Tag}
          label="Top Category"
          value={topCategory ? topCategory[0] : "—"}
          sub={topCategory ? `${formatINR(topCategory[1])} spent` : ""}
        />
        <StatCard
          icon={Receipt}
          label="Largest Expense"
          value={largestTransaction ? formatINR(Number(largestTransaction.amount)) : "—"}
          sub={
            largestTransaction ? largestTransaction.description || largestTransaction.category : ""
          }
        />
      </div>

      {/* Main Grid: AI Advisor on Left, Visual breakdown on Right */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* AI Report Card */}
        <Card className="p-6 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">AI Advisor Analysis</h3>
                <p className="text-xs text-muted-foreground">
                  Smart generated summary and financial behavior notes
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              {isFetching ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Regenerate
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[96%]" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-5 w-1/4 pt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[94%]" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-foreground">
                Unable to generate AI Advisor notes
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Please check your API key configurations or retry.
              </p>
              <Button onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
            </div>
          ) : reportText ? (
            <div className="prose dark:prose-invert max-w-none">
              <Markdown content={reportText} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No report generated yet. Click Regenerate to build report.
            </p>
          )}
        </Card>

        {/* Local Category Breakdown summary */}
        <Card className="p-6 h-fit space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Category Breakdown</h3>
            <p className="text-xs text-muted-foreground">
              Total transaction distribution for {monthNames[selectedMonth - 1]}
            </p>
          </div>

          {monthExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No transactions logged for this month.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => {
                  const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-foreground">{cat}</span>
                        <span className="text-muted-foreground">
                          {formatINR(amount)} ({percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
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
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="mt-2">
        <p className="text-xl font-bold text-foreground truncate">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </Card>
  );
}
