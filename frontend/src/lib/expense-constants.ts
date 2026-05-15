export const CATEGORIES = [
  "Food", "Travel", "Shopping", "Bills", "Health", "Hostel",
  "Books & Stationery", "College Fees", "Entertainment", "Other",
] as const;

export const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "var(--chart-1)",
  Travel: "var(--chart-2)",
  Shopping: "var(--chart-3)",
  Bills: "var(--chart-4)",
  Health: "var(--chart-5)",
  Hostel: "var(--chart-6)",
  "Books & Stationery": "var(--chart-7)",
  "College Fees": "var(--chart-8)",
  Entertainment: "var(--chart-2)",
  Other: "var(--chart-8)",
};

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  payment_method: string;
  description: string | null;
  expense_date: string;
  created_at: string;
};
