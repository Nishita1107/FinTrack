import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/expense-constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/add")({ component: AddExpense });

function AddExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setAmount("");
    setCategory("");
    setDate(today);
    setMethod("");
    setDesc("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!category) return toast.error("Pick a category");
    if (!method) return toast.error("Pick a payment method");
    setBusy(true);
    const { error } = await supabase.from("expenses").insert({
      user_id: user!.id,
      amount: amt,
      category,
      payment_method: method,
      description: desc || null,
      expense_date: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Expense added");
    qc.invalidateQueries({ queryKey: ["expenses"] });
    reset();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Expense</h1>
        <p className="text-sm text-muted-foreground">Log a new transaction</p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Lunch at canteen"
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? "Saving…" : "Add Expense"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
