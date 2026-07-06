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
    const { action, message, month, year, chatHistory = [] } = await req.json();

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
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentMonthStr = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

    // Category lists and formats
    const budgetLimit = Number(profile.monthly_budget);

    const contextData = {
      user: {
        name: profile.full_name,
        default_monthly_budget: budgetLimit
      },
      system_date: currentDate,
      current_month: currentMonthStr,
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

    if (action === "chat") {
      systemPrompt = `You are FinTrack AI, a personal finance assistant.
Answer using the user's financial data whenever possible.
If the answer requires calculations, compute them from the provided data.
If there is insufficient information, say so instead of guessing.
Keep answers concise, practical, and action-oriented.
Never output database technical details like table schemas, keys, or IDs.
Refer to values in Indian Rupees (₹).
Format your output using Markdown (bold, lists, headings).
Be encouraging but realistic about budgets and savings.`;

      // Build recent chat history block
      let historyText = "";
      if (chatHistory && chatHistory.length > 0) {
        historyText = "Recent conversation history:\n" + chatHistory.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") + "\n\n";
      }

      userPrompt = `${historyText}Current User Question: "${message}"

Here is the user's financial context for reference:
${JSON.stringify(contextData, null, 2)}`;

    } else if (action === "insights") {
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
