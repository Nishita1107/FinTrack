import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryAIAssistant, ChatMessage } from "@/lib/ai-service";
import { Markdown } from "@/lib/markdown";
import { useExpenses, useProfile, useBudgetFor } from "@/lib/use-expenses";

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMockSession, setIsMockSession] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const { data: expenses = [] } = useExpenses();
  const { data: profile } = useProfile();
  const now = new Date();
  const budget = useBudgetFor(now.getFullYear(), now.getMonth() + 1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check state on mount/open
  useEffect(() => {
    const isMock = localStorage.getItem("mock-user-session") !== null;
    const key = import.meta.env.VITE_GEMINI_API_KEY || "";
    setIsMockSession(isMock);
    setHasApiKey(key.trim().length > 0);
  }, [isOpen]);

  // Set dynamic welcome message when data is ready
  useEffect(() => {
    const isMock = localStorage.getItem("mock-user-session") !== null;
    const name = profile?.full_name || (isMock ? "Demo User" : "User");
    const currentMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.expense_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = budget - totalSpent;

    const byCat: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
    });
    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const topCatName = sortedCats[0]?.[0] || "None";
    const topCatAmt = sortedCats[0]?.[1] || 0;

    const timeString = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    setMessages([
      {
        role: "assistant",
        content: `Hi **${name}**! I'm **FinTrack AI**, your personal financial assistant.

Here is your snapshot for **${now.toLocaleString("en-US", { month: "long" })}**:
* **Monthly Budget:** ₹${budget}
* **Spent so far:** ₹${totalSpent}
* **Remaining Budget:** ₹${remaining} (${remaining >= 0 ? "Under budget" : "Over budget"})
* **Top category:** ${topCatName} (₹${topCatAmt})

Ask me anything about your spending, budget limits, or savings tips!`,
        timestamp: timeString,
      },
    ]);
  }, [profile, expenses, budget, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: nowTime,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build session history for context
      // Exclude initial prompt to avoid token bloat
      const chatHistory = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

      const response = await queryAIAssistant({
        action: "chat",
        message: text,
        chatHistory: [...chatHistory, userMsg],
      });

      const modelTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: modelTime }]);
    } catch (error) {
      console.error(error);
      const errTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again or check your backend configuration.",
          timestamp: errTime,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestClick = (promptText: string) => {
    handleSend(promptText);
  };

  const clearChat = () => {
    const clearTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setMessages([
      {
        role: "assistant",
        content: `Chat history cleared. I'm ready for new questions! 

Ask me anything about your spending, budgets, or savings.`,
        timestamp: clearTime,
      },
    ]);
  };

  const suggestedPrompts = [
    "How much did I spend on Food this month?",
    "Can I afford a ₹40,000 laptop?",
    "Give me tips to save more money.",
    "What was my largest expense?",
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-primary/95"
        title="Open Finance Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-fade-in" />
        ) : (
          <Sparkles className="h-6 w-6 animate-pulse" />
        )}
      </button>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed right-6 bottom-24 z-40 flex h-[520px] w-[350px] animate-fade-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/90 p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-foreground/90" />
              <div>
                <h3 className="text-sm font-semibold leading-none">FinTrack AI</h3>
                <p className="mt-1 text-[10px] text-primary-foreground/75 font-light">
                  {isMockSession && !hasApiKey ? "Simulated Mode" : "Personal Finance Assistant"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="rounded p-1 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Alert for Demo Mode without API Key */}
          {isMockSession && !hasApiKey && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 text-[10px] text-amber-600 dark:text-amber-500 border-b border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-amber-500" />
              <span>
                Simulated Preview Mode. Set <code>VITE_GEMINI_API_KEY</code> in `.env` for live AI.
              </span>
            </div>
          )}

          {/* Message List */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      m.role === "user"
                        ? "max-w-[85%] rounded-tr-none bg-primary text-primary-foreground"
                        : "max-w-[85%] rounded-tl-none bg-secondary/80 text-foreground"
                    }`}
                  >
                    <Markdown content={m.content} />
                  </div>
                  {m.timestamp && (
                    <span className="text-[9px] text-muted-foreground/80 mt-1 px-1">
                      {m.timestamp}
                    </span>
                  )}
                </div>
              ))}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-secondary/80 px-4 py-3 text-sm shadow-sm flex items-center gap-1">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce duration-300"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce duration-300"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce duration-300"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length === 1 && !isTyping && (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Suggested questions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSuggestClick(p)}
                      className="cursor-pointer rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-left text-xs text-primary transition-all duration-200 hover:bg-primary/10 hover:border-primary/40 active:scale-95"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3 bg-card"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your spending..."
              disabled={isTyping}
              className="flex-1 text-sm h-9 bg-secondary/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !input.trim()}
              className="h-9 w-9 flex-shrink-0 cursor-pointer"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
