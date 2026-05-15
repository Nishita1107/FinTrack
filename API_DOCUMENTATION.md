# FinTrack API Documentation

FinTrack uses a direct-to-database architectural pattern via the `@supabase/supabase-js` client. The API interactions are structured as frontend services/hooks communicating with the Supabase PostgREST endpoints.

## Authentication (Supabase Auth)

Authentication is handled via Supabase's built-in Auth service (GoTrue).

### 1. Sign Up
- **Method:** `supabase.auth.signUp()`
- **Payload:** `{ email, password, options: { data: { full_name } } }`
- **Description:** Registers a new user and triggers a database function to populate the `profiles` table automatically.

### 2. Login
- **Method:** `supabase.auth.signInWithPassword()`
- **Payload:** `{ email, password }`
- **Description:** Authenticates the user and returns a JWT session.

### 3. Logout
- **Method:** `supabase.auth.signOut()`
- **Description:** Ends the current user session and clears the local auth state.

---

## Data Endpoints

Data access is strictly controlled by PostgreSQL Row-Level Security (RLS) policies.

### Profiles

#### Get Current User Profile
- **Query:** `supabase.from('profiles').select('*').eq('id', user_id).single()`
- **Returns:** `{ id, full_name, monthly_budget, created_at, updated_at }`

#### Update Monthly Budget
- **Query:** `supabase.from('profiles').update({ monthly_budget }).eq('id', user_id)`
- **Payload:** `{ monthly_budget: number }`

### Expenses / Transactions

#### Get All Expenses
- **Query:** `supabase.from('expenses').select('*').order('expense_date', { ascending: false })`
- **Returns:** `Array<{ id, user_id, amount, category, payment_method, description, expense_date, created_at }>`

#### Add New Expense
- **Query:** `supabase.from('expenses').insert([{ amount, category, payment_method, description, expense_date, user_id }])`
- **Payload:** `{ amount: number, category: string, payment_method: string, description?: string, expense_date: date }`

#### Update Expense
- **Query:** `supabase.from('expenses').update({ amount, category, payment_method, description, expense_date }).eq('id', expense_id)`

#### Delete Expense
- **Query:** `supabase.from('expenses').delete().eq('id', expense_id)`

---

## Edge Functions & Hooks
The frontend handles data fetching using **React Query** (`@tanstack/react-query`) combined with the Supabase client. Custom hooks located in `frontend/src/hooks/` encapsulate these API calls for clean, reusable interactions.
