import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useExpenses } from "@/lib/use-expenses";
import { CATEGORIES, formatINR, type Expense } from "@/lib/expense-constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Download, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authed/history")({ component: History });

function History() {
  const { data: expenses = [], isLoading } = useExpenses();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [month, setMonth] = useState("all");
  const [editing, setEditing] = useState<Expense | null>(null);

  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.expense_date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = expenses.filter((e) => {
    if (cat !== "all" && e.category !== cat) return false;
    if (month !== "all" && !e.expense_date.startsWith(month)) return false;
    if (search && !(e.description?.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const del = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["expenses"] });
  };

  const exportCsv = () => {
    const rows = [["Date", "Category", "Description", "Payment", "Amount"]];
    filtered.forEach((e) => rows.push([e.expense_date, e.category, e.description ?? "", e.payment_method, String(e.amount)]));
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `expenses-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Expense History</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} transactions • {formatINR(total)}</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search description or category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No expenses found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new expense.</p>
          <Link to="/add"><Button>+ Add Expense</Button></Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-muted-foreground">{e.expense_date}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{e.description || "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{e.category}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{e.payment_method}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(Number(e.amount))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(e)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => del(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border md:hidden">
            {filtered.map((e) => (
              <li key={e.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{e.description || e.category}</p>
                    <p className="text-xs text-muted-foreground">{e.expense_date} • {e.category} • {e.payment_method}</p>
                  </div>
                  <p className="font-semibold">{formatINR(Number(e.amount))}</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(e)}><Pencil className="h-3 w-3" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => del(e.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <EditDialog expense={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");

  // initialize when expense changes
  useMemoInit(expense, (e) => { setAmount(String(e.amount)); setDesc(e.description ?? ""); setCat(e.category); });

  if (!expense) return null;

  const save = async () => {
    const { error } = await supabase.from("expenses").update({
      amount: Number(amount), description: desc || null, category: cat,
    }).eq("id", expense.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["expenses"] });
    onClose();
  };

  return (
    <Dialog open={!!expense} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// helper hook to init local state when prop changes
import { useEffect, useRef } from "react";
function useMemoInit<T>(value: T, init: (v: NonNullable<T>) => void) {
  const last = useRef<T | null>(null);
  useEffect(() => {
    if (value && value !== last.current) { init(value as NonNullable<T>); last.current = value; }
    if (!value) last.current = null;
  }, [value]);
}
