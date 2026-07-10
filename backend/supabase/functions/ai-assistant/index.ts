import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase Client with the user's auth header
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read payload
    const { action, month, year } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Gemini API Key
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the backend" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrieve user financial data (respecting RLS)
    const [profileResult, expensesResult, budgetsResult] = await Promise.all([
      supabaseClient.from("profiles").select("*").maybeSingle(),
      supabaseClient.from("expenses").select("*").order("expense_date", { ascending: false }).limit(1000),
      supabaseClient.from("monthly_budgets").select("*").limit(1000)
    ]);

    if (profileResult.error) throw profileResult.error;
    if (expensesResult.error) throw expensesResult.error;
    if (budgetsResult.error) throw budgetsResult.error;

    const profile = profileResult.data || { full_name: "User", monthly_budget: 10000 };
    const expenses = expensesResult.data || [];
    const budgets = budgetsResult.data || [];

    // Build context
    const budgetLimit = Number(profile.monthly_budget);
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentMonthStr = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

    // Compute current month statistics
    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthExpenses = expenses.filter((e: any) => {
      const d = new Date(e.expense_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
    });
    const totalSpent = currentMonthExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const activeOverride = budgets.find((b: any) => Number(b.year) === currentYear && Number(b.month) === currentMonthIdx + 1);
    const activeBudget = activeOverride ? Number(activeOverride.budget) : budgetLimit;
    const remaining = activeBudget - totalSpent;

    const byCat: Record<string, number> = {};
    currentMonthExpenses.forEach((e: any) => {
      byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
    });
    const sortedCats = Object.entries(byCat).sort((a: any, b: any) => b[1] - a[1]);
    const topCategoryName = sortedCats[0]?.[0] || "None";
    const topCategorySpent = sortedCats[0]?.[1] || 0;

    const contextData = {
      user: {
        name: profile.full_name,
        default_monthly_budget: budgetLimit
      },
      system_date: currentDate,
      current_month: currentMonthStr,
      computed_stats: {
        current_month_budget: activeBudget,
        current_month_spent: totalSpent,
        current_month_remaining: remaining,
        top_spending_category: topCategoryName,
        top_spending_category_amount: topCategorySpent,
        category_spending_breakdown: byCat
      },
      monthly_budget_overrides: budgets.map((b: any) => ({
        year: b.year,
        month: b.month,
        budget: b.budget
      })),
      expenses: expenses.map((e: any) => ({
        amount: Number(e.amount),
        category: e.category,
        payment_method: e.payment_method,
        description: e.description || "",
        date: e.expense_date
      }))
    };

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "insights") {
      systemPrompt = `You are FinTrack AI.
Analyze the user's transaction and budget history to generate 4-5 bulleted, dynamic, highly personalized financial insights.
Each observation should be short, concise (1 sentence), and action-oriented.
Examples:
- "Food spending increased by 18% this month compared to last month."
- "You've spent ₹8,200 on Shopping, close to exceeding your ₹10,000 budget."
- "Great job! Your Entertainment spending has decreased by 40%."
- "You have ₹4,200 remaining in your budget for the month; save it to meet your goals."
- "Your largest transaction this month was ₹12,000 for Bills on June 14."

Generate EXACTLY 4 to 5 bullet points. Do not include introductory or concluding text. Do not number the bullets. Start each line with a dash '-'. Use ₹ symbol for currencies.`;

      userPrompt = `Please generate the insights card bullet points based on this data:
${JSON.stringify(contextData, null, 2)}`;

    } else if (action === "report") {
      const selectedYear = Number(year || new Date().getFullYear());
      const selectedMonth = Number(month || (new Date().getMonth() + 1));
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
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

Keep the advice highly tailored to the transactions and spending behavior in this month's data. Avoid generic templates.
Use clear headings (##, ###) and bold text. Use ₹ symbol.`;

      userPrompt = `Please generate the report for ${monthName} ${selectedYear} based on this data:
${JSON.stringify(contextData, null, 2)}`;

    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const apiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API returned error: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    const generatedText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return new Response(JSON.stringify({ response: generatedText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
