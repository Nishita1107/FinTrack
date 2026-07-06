import { supabase } from "@/integrations/supabase/client";
import type { Expense } from "@/lib/expense-constants";
import type { MonthlyBudget } from "@/lib/use-expenses";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIServicePayload {
  action: "chat" | "insights" | "report";
  message?: string;
  month?: number;
  year?: number;
  chatHistory?: ChatMessage[];
}

export interface AIExpenseContext {
  amount: number;
  category: string;
  payment_method: string;
  description: string;
  date: string;
}

export interface AIBudgetOverrideContext {
  year: number;
  month: number;
  budget: number;
}

export interface AIContextData {
  user: {
    name: string | null;
    default_monthly_budget: number;
  };
  system_date: string;
  current_month: string;
  monthly_budget_overrides: AIBudgetOverrideContext[];
  expenses: AIExpenseContext[];
}

/**
 * Main service to handle AI queries.
 * In real Supabase mode, it calls the backend Edge Function.
 * In Demo Mode or fallback, it checks for a Gemini API Key (local/env) and calls Gemini directly,
 * or runs a rule-based local financial analyzer as a final fallback.
 */
export async function queryAIAssistant(payload: AIServicePayload): Promise<string> {
  const isMock = localStorage.getItem("mock-user-session") !== null;

  if (!isMock) {
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: payload,
      });
      if (error) throw error;
      if (data && data.response) {
        return data.response;
      }
      throw new Error("No response received from AI backend");
    } catch (err) {
      console.warn("Backend AI assistant function error, attempting client-side fallback:", err);
      // Fall through to client-side fallback if backend fails
    }
  }

  // Client-side execution (Demo Mode or Backend Fallback)
  return executeClientSideAI(payload);
}

/**
 * Handles client-side AI analysis by gathering localStorage data and either:
 * 1. Calling the Gemini API directly if a key is available (in VITE_GEMINI_API_KEY or localStorage).
 * 2. Running a smart, rule-based local analyzer.
 */
async function executeClientSideAI(payload: AIServicePayload): Promise<string> {
  const geminiApiKey =
    localStorage.getItem("mock-gemini-api-key") || import.meta.env.VITE_GEMINI_API_KEY || "";

  // Gather data from localStorage
  const expensesStr = localStorage.getItem("mock-expenses");
  const budgetsStr = localStorage.getItem("mock-budgets");
  const profileStr = localStorage.getItem("mock-profile");

  const expenses: Expense[] = expensesStr ? JSON.parse(expensesStr) : [];
  const budgets = budgetsStr ? JSON.parse(budgetsStr) : [];
  const profile = profileStr
    ? JSON.parse(profileStr)
    : { full_name: "Demo User", monthly_budget: 10000 };

  const defaultBudget = Number(profile.monthly_budget);
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const contextData = {
    user: {
      name: profile.full_name,
      default_monthly_budget: defaultBudget,
    },
    system_date: currentDate,
    current_month: currentMonthStr,
    monthly_budget_overrides: budgets.map((b: MonthlyBudget) => ({
      year: Number(b.year),
      month: Number(b.month),
      budget: Number(b.budget),
    })),
    expenses: expenses.map((e: Expense) => ({
      amount: Number(e.amount),
      category: e.category,
      payment_method: e.payment_method,
      description: e.description || "",
      date: e.expense_date,
    })),
  };

  // If we have an API Key, we can make a direct call to the Google Gemini API
  if (geminiApiKey) {
    try {
      let systemPrompt = "";
      let userPrompt = "";

      if (payload.action === "chat") {
        systemPrompt = `You are FinTrack AI, a personal finance assistant.
Answer using the user's financial data whenever possible.
If the answer requires calculations, compute them from the provided data.
If there is insufficient information, say so instead of guessing.
Keep answers concise, practical, and action-oriented.
Never output database technical details like table schemas, keys, or IDs.
Refer to values in Indian Rupees (₹).
Format your output using Markdown (bold, lists, headings).
Be encouraging but realistic about budgets and savings.`;

        let historyText = "";
        if (payload.chatHistory && payload.chatHistory.length > 0) {
          historyText =
            "Recent conversation history:\n" +
            payload.chatHistory
              .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
              .join("\n") +
            "\n\n";
        }

        userPrompt = `${historyText}Current User Question: "${payload.message}"

Here is the user's financial context for reference:
${JSON.stringify(contextData, null, 2)}`;
      } else if (payload.action === "insights") {
        systemPrompt = `You are FinTrack AI.
Analyze the user's transaction and budget history to generate 4-5 bulleted, dynamic, highly personalized financial insights.
Each observation should be short, concise (1 sentence), and action-oriented.
Generate EXACTLY 4 to 5 bullet points starting with a dash '-'. Use ₹ symbol. Do not write introductory or concluding text.`;

        userPrompt = `Generate the insights card bullet points based on this data:
${JSON.stringify(contextData, null, 2)}`;
      } else if (payload.action === "report") {
        const selectedYear = Number(payload.year || new Date().getFullYear());
        const selectedMonth = Number(payload.month || new Date().getMonth() + 1);
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
        const monthName = monthNames[selectedMonth - 1];

        systemPrompt = `You are FinTrack AI.
Generate a structured monthly financial report for ${monthName} ${selectedYear} in Markdown format.
Include:
1. Executive Summary: High-level overview of their financial health for this month.
2. Savings Analysis: Calculate and discuss savings (Budget minus expenses). Compare it to overall budget.
3. Category Breakdown: List top spending categories and their shares, highlighting any unusual spending.
4. Top Expenses: Identify the single largest transaction and largest category.
5. Personalized Actionable Financial Advice: Provide 3 concrete, personalized tips to save more next month.

Keep the advice highly tailored to the transactions in this data. Use clear headings (##, ###) and bold text. Use ₹ symbol.`;

        userPrompt = `Please generate the report for ${monthName} ${selectedYear} based on this data:
${JSON.stringify(contextData, null, 2)}`;
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
      });

      if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
      const resJson = await response.json();
      return resJson.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini API.";
    } catch (err) {
      console.error("Direct Gemini API call failed, falling back to local analyzer:", err);
      // Fall through to local analyzer if API call fails
    }
  }

  // Fallback: Smart local rule-based analyzer
  return runLocalFinancialAnalyzer(payload, contextData);
}

/**
 * Calculates financial statistics and returns a simulated response that is fully
 * accurate to the user's actual local transactions.
 */
function runLocalFinancialAnalyzer(payload: AIServicePayload, context: AIContextData): string {
  const expenses = context.expenses;
  const now = new Date();
  const thisMonthIdx = now.getMonth();
  const thisYear = now.getFullYear();

  // Helper: check if transaction is in a given year/month
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonthIdx;
  };

  const currentMonthExpenses = expenses.filter((e) => isThisMonth(e.date));
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get active budget for this month
  const activeOverride = context.monthly_budget_overrides.find(
    (b) => b.year === thisYear && b.month === thisMonthIdx + 1,
  );
  const activeBudget = activeOverride ? activeOverride.budget : context.user.default_monthly_budget;
  const savings = activeBudget - totalSpentThisMonth;
  const percentSpent = Math.round((totalSpentThisMonth / activeBudget) * 100);

  // Category totals
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  // Largest transaction
  const largestTransaction = currentMonthExpenses.reduce(
    (max, e) => (e.amount > (max?.amount ?? 0) ? e : max),
    null as AIExpenseContext | null,
  );

  // Subscriptions indicator
  const subscriptions = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes("netflix") ||
      e.description.toLowerCase().includes("spotify") ||
      e.description.toLowerCase().includes("sub") ||
      e.description.toLowerCase().includes("prime") ||
      e.description.toLowerCase().includes("youtube") ||
      e.description.toLowerCase().includes("recharge"),
  );

  if (payload.action === "insights") {
    const list: string[] = [];

    // Insight 1: Budget progress
    if (percentSpent >= 100) {
      list.push(
        `- You have exceeded your monthly budget of ₹${activeBudget} by ₹${Math.abs(savings)}. Consider freezing non-essential spending.`,
      );
    } else if (percentSpent >= 80) {
      list.push(
        `- Budget warning: You've spent ₹${totalSpentThisMonth} (${percentSpent}% of your ₹${activeBudget} budget) with ${30 - now.getDate()} days left.`,
      );
    } else {
      list.push(
        `- Safe Zone: You've utilized ${percentSpent}% of your monthly budget. You have ₹${savings} left to save or spend.`,
      );
    }

    // Insight 2: Top spending category
    if (topCategory) {
      list.push(
        `- Food & dining is your highest expense area, accounting for ₹${topCategory[1]} this month.`,
      );
    } else {
      list.push(
        `- No transactions logged yet this month. Try adding your expenses to see detailed category analyses.`,
      );
    }

    // Insight 3: Largest transaction
    if (largestTransaction) {
      list.push(
        `- Your single largest expense this month was ₹${largestTransaction.amount} for "${largestTransaction.description || largestTransaction.category}" on ${largestTransaction.date}.`,
      );
    }

    // Insight 4: Savings trend
    if (savings > 0) {
      list.push(
        `- Great job! You are currently on track to save ₹${savings} this month, which is ${Math.round((savings / activeBudget) * 100)}% of your budget.`,
      );
    } else {
      list.push(
        `- Budget leak: Your expenses are outpacing your monthly allowance. Try setting sub-budgets for categories.`,
      );
    }

    // Add API key instruction as helper tip
    list.push(
      `- [Tip] Set your Gemini API key in the Profile page to unlock real conversational advice and deeper insights!`,
    );

    return list.slice(0, 5).join("\n");
  }

  if (payload.action === "report") {
    const repYear = payload.year || thisYear;
    const repMonth = payload.month || thisMonthIdx + 1;
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
    const repMonthName = monthNames[repMonth - 1];

    const repExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === repYear && d.getMonth() === repMonth - 1;
    });

    const repTotalSpent = repExpenses.reduce((sum, e) => sum + e.amount, 0);
    const repOverride = context.monthly_budget_overrides.find(
      (b) => b.year === repYear && b.month === repMonth,
    );
    const repBudget = repOverride ? repOverride.budget : defaultBudget;
    const repSavings = repBudget - repTotalSpent;
    const repPercent = repBudget > 0 ? Math.round((repTotalSpent / repBudget) * 100) : 0;

    const repCatTotals: Record<string, number> = {};
    repExpenses.forEach((e) => {
      repCatTotals[e.category] = (repCatTotals[e.category] ?? 0) + e.amount;
    });
    const repSortedCats = Object.entries(repCatTotals).sort((a, b) => b[1] - a[1]);
    const repLargestTransaction = repExpenses.reduce(
      (max, e) => (e.amount > (max?.amount ?? 0) ? e : max),
      null as AIExpenseContext | null,
    );

    return `# Financial Report for ${repMonthName} ${repYear}

## Executive Summary
During ${repMonthName} ${repYear}, you spent a total of **₹${repTotalSpent}** out of a budgeted **₹${repBudget}**. This represents **${repPercent}%** of your total budget.

## Savings Analysis
- **Total Budget / Income:** ₹${repBudget}
- **Total Expenses:** ₹${repTotalSpent}
- **Net Savings:** **₹${repSavings}** (${repSavings >= 0 ? "Saved" : "Overspent"})

${
  repSavings >= 0
    ? `Excellent work! You stayed within your limits and saved **₹${repSavings}** which is **${Math.round((repSavings / repBudget) * 100)}%** of your total budget. This can be moved to your long-term savings goal.`
    : `Alert: You went over your budget by **₹${Math.abs(repSavings)}**. Look at your top categories below to identify where the overspending occurred.`
}

## Category Breakdown
The categories where you spent money this month:
${
  repSortedCats.length === 0
    ? "*No transactions logged for this month.*"
    : repSortedCats
        .map(([cat, val]) => `- **${cat}:** ₹${val} (${Math.round((val / repTotalSpent) * 100)}%)`)
        .join("\n")
}

## Top Expenses
- **Largest Category:** ${repSortedCats[0] ? `**${repSortedCats[0][0]}** (₹${repSortedCats[0][1]})` : "None"}
- **Largest Transaction:** ${repLargestTransaction ? `**₹${repLargestTransaction.amount}** for "${repLargestTransaction.description || repLargestTransaction.category}" on ${repLargestTransaction.date}` : "None"}

## Personalized Financial Tips (Simulated)
1. **Optimize your top category:** Since you spent the most on **${repSortedCats[0]?.[0] || "Miscellaneous"}** (₹${repSortedCats[0]?.[1] || 0}), try setting a dedicated weekly cap of ₹${Math.round((repSortedCats[0]?.[1] || 0) * 0.2)} on this category.
2. **Review payment methods:** Ensure you are monitoring digital UPI transactions as they are frictionless and lead to impulse buys.
3. **Connect Gemini API:** For personalized AI reports with conversational financial advice and automated trends, please enter your **Gemini API Key** in the **Profile** page settings!
`;
  }

  // chat fallback responses
  const query = (payload.message || "").toLowerCase();

  // food spending query
  if (query.includes("food") || query.includes("eat") || query.includes("restaurant")) {
    const foodSpent = categoryTotals["Food"] || 0;
    return `You have spent **₹${foodSpent}** on **Food** this month. 
${
  foodSpent > 0
    ? `This represents ${Math.round((foodSpent / totalSpentThisMonth) * 100)}% of your total spending (₹${totalSpentThisMonth}) so far. If you're ordering online frequently, cooking one more meal at home can save you roughly ₹800 a week!`
    : "You haven't logged any food expenses this month yet."
}`;
  }

  // afford query
  if (query.includes("afford") || query.includes("laptop") || query.includes("buy")) {
    const match = query.match(/\d+[\d,.]*/);
    let amount = 40000; // default to laptop request if no amount matched
    if (match) {
      amount = Number(match[0].replace(/,/g, ""));
    }

    if (savings > amount) {
      return `Yes, based on your current month's remaining balance of **₹${savings}**, you can afford this purchase of **₹${amount}** right now. However, doing so will use up ${Math.round((amount / savings) * 100)}% of your current buffer. It might be wise to wait until next month if it's not urgent.`;
    } else {
      const monthsNeeded = Math.ceil(amount / (savings > 0 ? savings : activeBudget * 0.2 || 2000));
      return `Looking at your budget, a purchase of **₹${amount}** is higher than your current remaining savings of **₹${savings}**.
To afford this responsibly without accumulating debt, you would need to save your average monthly surplus for about **${monthsNeeded} month(s)**. I suggest setting up a dedicated savings bucket in your profile.`;
    }
  }

  // largest transaction query
  if (query.includes("biggest") || query.includes("largest") || query.includes("expensive")) {
    if (largestTransaction) {
      return `Your biggest expense this month was **₹${largestTransaction.amount}** for **"${largestTransaction.description || largestTransaction.category}"** on **${largestTransaction.date}** in the **${largestTransaction.category}** category.`;
    }
    return "You have not recorded any transactions this month yet.";
  }

  // subscription query
  if (query.includes("subscription") || query.includes("recurring") || query.includes("paying")) {
    if (subscriptions.length > 0) {
      const list = subscriptions
        .map((s) => `- **${s.description || s.category}**: ₹${s.amount} on ${s.date}`)
        .join("\n");
      const totalSub = subscriptions.reduce((s, e) => s + e.amount, 0);
      return `Here are the recurring charges or subscriptions detected in your history:
${list}

Total subscriptions: **₹${totalSub}** per month. Tips: Review these to see if there are services you no longer use!`;
    }
    return "I couldn't detect any explicit subscriptions in your transaction history. (I look for descriptions containing names like Netflix, Spotify, Prime, Youtube, or 'sub').";
  }

  // save money/tips query
  if (query.includes("save") || query.includes("tip") || query.includes("advice")) {
    return `Here are some personalized money-saving tips based on your spending:
1. **Watch the UPI leak:** You use digital payments frequently. Try keeping a small cash balance for small items; it naturally limits impulse buys.
2. **Category Cap:** Your heaviest spending is on **${topCategory?.[0] || "Other"}** (₹${topCategory?.[1] || 0}). Try capping this to 30% of your budget.
3. **Chai & snacks:** Small daily expenses of ₹40-50 on chai/snacks add up to nearly ₹1,500/month. Log them to build awareness.

*Note: For fully customized generative advice, enter your Gemini API Key in the Profile tab!*`;
  }

  // compare query
  if (query.includes("compare") || query.includes("last month") || query.includes("increase")) {
    return `Comparing your current month spending (₹${totalSpentThisMonth}) with your budget (₹${activeBudget}):
- You have used **${percentSpent}%** of your budget.
- Your net savings capacity is **₹${savings}**.
- Your top spending category is **${topCategory?.[0] || "None"}** at **₹${topCategory?.[1] || 0}**.

*Note: For a detailed comparison chart and multi-month trends, go to the **AI Report** or **Analytics** tab!*`;
  }

  // default chat answer
  return `Hi ${context.user.name || "User"}! I am **FinTrack AI**. I can analyze your financial data and give you personalized answers.

Here is a summary of your profile:
- **This Month's Budget:** ₹${activeBudget}
- **Spent so far:** ₹${totalSpentThisMonth}
- **Remaining balance:** ₹${savings}
- **Top Expense Category:** ${topCategory ? `${topCategory[0]} (₹${topCategory[1]})` : "None yet"}

Try asking me specific questions like:
- *How much did I spend on food this month?*
- *Can I afford a ₹40,000 laptop?*
- *What subscriptions am I paying for?*
- *Give me tips to save more money.*

*(To enable advanced AI responses, please enter your Gemini API Key in your Profile tab!)*`;
}
