import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Expense } from "@/lib/expense-constants";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const isMock = localStorage.getItem("mock-user-session") !== null;
      if (isMock) {
        const stored = localStorage.getItem("mock-expenses");
        return stored ? JSON.parse(stored) : [];
      }
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const isMock = localStorage.getItem("mock-user-session") !== null;
      if (isMock) {
        const storedProfile = localStorage.getItem("mock-profile");
        if (storedProfile) return JSON.parse(storedProfile);
        return {
          id: "00000000-0000-0000-0000-000000000000",
          full_name: "Demo User",
          monthly_budget: 10000,
        };
      }
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type MonthlyBudget = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  budget: number;
};

export function useMonthlyBudgets() {
  return useQuery({
    queryKey: ["monthly_budgets"],
    queryFn: async () => {
      const isMock = localStorage.getItem("mock-user-session") !== null;
      if (isMock) {
        const stored = localStorage.getItem("mock-budgets");
        return stored ? JSON.parse(stored) : [];
      }
      const { data, error } = await supabase.from("monthly_budgets").select("*").limit(1000);
      if (error) throw error;
      return (data ?? []) as MonthlyBudget[];
    },
  });
}

/** Returns budget for a specific year/month, falling back to profile.monthly_budget. */
export function useBudgetFor(year: number, month: number) {
  const { data: budgets = [] } = useMonthlyBudgets();
  const { data: profile } = useProfile();
  const override = budgets.find((b) => b.year === year && b.month === month);
  return Number(override?.budget ?? profile?.monthly_budget ?? 10000);
}

export function useSetMonthlyBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      year,
      month,
      budget,
    }: {
      year: number;
      month: number;
      budget: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const isMock = localStorage.getItem("mock-user-session") !== null;
      if (isMock) {
        const stored = localStorage.getItem("mock-budgets");
        const list: MonthlyBudget[] = stored ? JSON.parse(stored) : [];
        const index = list.findIndex((b) => b.year === year && b.month === month);
        if (index >= 0) {
          list[index].budget = budget;
        } else {
          list.push({
            id: Math.random().toString(),
            user_id: user.id,
            year,
            month,
            budget,
          });
        }
        localStorage.setItem("mock-budgets", JSON.stringify(list));
        return;
      }
      const { error } = await supabase
        .from("monthly_budgets")
        .upsert({ user_id: user.id, year, month, budget }, { onConflict: "user_id,year,month" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthly_budgets"] }),
  });
}
