import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  BarChart3,
  User,
  LogOut,
  Wallet,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add", label: "Add Expense", icon: PlusCircle },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/report", label: "AI Report", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground animate-fade-in gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground animate-bounce shadow-md">
          <Wallet className="h-6 w-6" />
        </span>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading FinTrack…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">FinTrack</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Logout</span>
          </Button>
        </div>
        {/* Mobile nav */}
        <nav className="flex overflow-x-auto border-t border-border md:hidden">
          {navItems.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-1 min-w-fit flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        FinTrack © 2026 · Student Expense Management System
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}
