import { createFileRoute } from "@tanstack/react-router";
import { useExpenses, useProfile, useMonthlyBudgets } from "@/lib/use-expenses";
import { CATEGORIES, CATEGORY_COLORS, formatINR } from "@/lib/expense-constants";
import { Card } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authed/analytics")({ component: Analytics });

function Analytics() {
  const { data: expenses = [] } = useExpenses();
  const { data: profile } = useProfile();
  const { data: monthlyBudgets = [] } = useMonthlyBudgets();
  const defaultBudget = Number(profile?.monthly_budget ?? 10000);

  const year = new Date().getFullYear();

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount); });
    return CATEGORIES.filter((c) => map[c]).map((c) => ({ name: c, value: Math.round(map[c]) }));
  }, [expenses]);

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ month: new Date(year, i).toLocaleString("en", { month: "short" }), spent: 0 }));
    expenses.forEach((e) => {
      const d = new Date(e.expense_date);
      if (d.getFullYear() === year) arr[d.getMonth()].spent += Number(e.amount);
    });
    return arr.map((m) => ({ ...m, spent: Math.round(m.spent) }));
  }, [expenses, year]);

  const budgetVs = monthly.map((m, i) => {
    const override = monthlyBudgets.find((b) => b.year === year && b.month === i + 1);
    return { month: m.month, Budget: Number(override?.budget ?? defaultBudget), Spent: m.spent };
  });

  const top = [...byCat].sort((a, b) => b.value - a.value)[0];
  const heaviest = [...monthly].sort((a, b) => b.spent - a.spent)[0];
  const avg = monthly.reduce((s, m) => s + m.spent, 0) / 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Category, monthly trend and budget comparison</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Top category" value={top?.name ?? "—"} sub={top ? formatINR(top.value) : ""} />
        <MiniStat label="Heaviest month" value={heaviest?.spent ? heaviest.month : "—"} sub={heaviest?.spent ? formatINR(heaviest.spent) : ""} />
        <MiniStat label="Average per month" value={formatINR(Math.round(avg))} sub={`Year ${year}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Category-wise expenses</p>
          <div className="h-72">
            {byCat.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {byCat.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Monthly trend ({year})</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="spent" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-foreground">Budget vs Spent</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVs}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Budget" fill="var(--chart-8)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Add expenses to see analytics</div>;
}
