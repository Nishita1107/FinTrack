# FinTrack API Documentation

FinTrack uses **Supabase** as its backend service and follows a direct-to-database architecture using the `@supabase/supabase-js` client library.  
The frontend communicates directly with Supabase for authentication and database operations without requiring a separate Express or Node.js backend server.

---

# Authentication (Supabase Auth)

Authentication is handled using Supabase's built-in authentication service.

## 1. Sign Up
- **Method:** `supabase.auth.signUp()`
- **Payload:** `{ email, password, options: { data: { full_name } } }`
- **Description:**  
  Registers a new user account and automatically creates a corresponding profile entry in the database.

---

## 2. Login
- **Method:** `supabase.auth.signInWithPassword()`
- **Payload:** `{ email, password }`
- **Description:**  
  Authenticates an existing user and returns a secure JWT session.

---

## 3. Logout
- **Method:** `supabase.auth.signOut()`
- **Description:**  
  Ends the current session and logs the user out securely.

---

# Database Operations

All database operations are protected using **PostgreSQL Row-Level Security (RLS)** policies to ensure users can only access their own data.

---

# Profile Management

## Get Current User Profile
- **Query:**  
  `supabase.from('profiles').select('*').eq('id', user_id).single()`

- **Returns:**  
  `{ id, full_name, monthly_budget, created_at, updated_at }`

- **Description:**  
  Fetches the currently logged-in user's profile information and budget details.

---

## Update Monthly Budget
- **Query:**  
  `supabase.from('profiles').update({ monthly_budget }).eq('id', user_id)`

- **Payload:**  
  `{ monthly_budget: number }`

- **Description:**  
  Updates the user's monthly spending budget.

---

# Expense Management

## Get All Expenses
- **Query:**  
  `supabase.from('expenses').select('*').order('expense_date', { ascending: false })`

- **Returns:**  
  `Array<{ id, user_id, amount, category, payment_method, description, expense_date, created_at }>`

- **Description:**  
  Retrieves all expense records for the logged-in user sorted by latest transaction date.

---

## Add New Expense
- **Query:**  
  `supabase.from('expenses').insert([{ amount, category, payment_method, description, expense_date, user_id }])`

- **Payload:**  
  `{ amount: number, category: string, payment_method: string, description?: string, expense_date: date }`

- **Description:**  
  Creates a new expense entry and stores it in the database.

---

## Update Expense
- **Query:**  
  `supabase.from('expenses').update({ amount, category, payment_method, description, expense_date }).eq('id', expense_id)`

- **Description:**  
  Updates an existing expense record.

---

## Delete Expense
- **Query:**  
  `supabase.from('expenses').delete().eq('id', expense_id)`

- **Description:**  
  Permanently removes an expense entry from the database.

---

# Frontend Hooks & Data Fetching

The frontend handles data fetching using **React Query** (`@tanstack/react-query`) combined with the Supabase client SDK.

Custom hooks located in:

```txt
frontend/src/hooks/
