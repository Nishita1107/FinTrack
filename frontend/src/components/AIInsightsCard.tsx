import { useQuery } from "@tanstack/react-query";
import { useExpenses, useProfile, useMonthlyBudgets } from "@/lib/use-expenses";
import { queryAIAssistant } from "@/lib/ai-service";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/lib/markdown";

export function AIInsightsCard() {
  const { data: expenses = [] } = useExpenses();
  const { data: profile } = useProfile();
  const { data: budgets = [] } = useMonthlyBudgets();

  // Create a dependency hash so we refetch when data changes, but cache otherwise
  const dataHash = `${expenses.length}-${expenses[0]?.id || ""}-${profile?.monthly_budget || ""}-${budgets.length}`;

  const {
    data: insights,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai-insights", dataHash],
    queryFn: () => queryAIAssistant({ action: "insights" }),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 1,
  });

  const bullets = insights
    ? insights
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter(Boolean)
    : [];

  return (
    <Card className="p-5 transition-all duration-300 hover:shadow-md border border-border bg-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Spending Insights</h3>
            <p className="text-xs text-muted-foreground">
              Automated spending and budget observations
            </p>
          </div>
        </div>
        {isFetching && !isLoading && (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[95%]" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <AlertCircle className="h-6 w-6 text-destructive mb-2" />
          <p className="text-xs text-muted-foreground mb-3">Failed to load insights.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      ) : bullets.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          No insights generated yet. Try adding some transactions.
        </p>
      ) : (
        <ul className="space-y-3">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0 animate-pulse" />
              <div className="text-muted-foreground leading-relaxed">
                <Markdown content={bullet} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
