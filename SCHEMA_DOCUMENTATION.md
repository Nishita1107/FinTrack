# FinTrack Database Schema Documentation

FinTrack utilizes PostgreSQL managed via Supabase. Row-Level Security (RLS) is enabled to securely isolate each user's data.

## Tables

### 1. `profiles`
Stores user profile information and settings. Automatically populated when a new user signs up via Supabase Auth triggers.

| Column           | Type          | Modifiers                 | Description                          |
|------------------|---------------|---------------------------|--------------------------------------|
| `id`             | UUID          | PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE | Links to Supabase Auth user. |
| `full_name`      | TEXT          | NULL                      | User's full name.                    |
| `monthly_budget` | NUMERIC(10,2) | NOT NULL, DEFAULT `10000` | The user's set monthly budget limit. |
| `created_at`     | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()` | Record creation timestamp.           |
| `updated_at`     | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()` | Record last update timestamp.        |

**RLS Policies:**
- **Select**: Users can view their own profile.
- **Insert**: Users can insert their own profile.
- **Update**: Users can update their own profile.

---

### 2. `expenses`
Stores individual transaction/expense records for users.

| Column           | Type          | Modifiers                 | Description                          |
|------------------|---------------|---------------------------|--------------------------------------|
| `id`             | UUID          | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique transaction identifier. |
| `user_id`        | UUID          | NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE | Owner of the expense. |
| `amount`         | NUMERIC(10,2) | NOT NULL, CHECK (`amount >= 0`) | The monetary amount.                 |
| `category`       | TEXT          | NOT NULL                  | Category (e.g., Food, Transport).    |
| `payment_method` | TEXT          | NOT NULL                  | Method (e.g., Cash, Credit Card).    |
| `description`    | TEXT          | NULL                      | Additional notes/description.        |
| `expense_date`   | DATE          | NOT NULL, DEFAULT `CURRENT_DATE` | The date of the expense.             |
| `created_at`     | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()` | Record creation timestamp.           |

**Indexes:**
- `idx_expenses_user_date` on `(user_id, expense_date DESC)` to optimize dashboard and chart queries.

**RLS Policies:**
- **Select, Insert, Update, Delete**: Users can only perform these actions on their own expenses.

---

## Triggers and Functions

- **`handle_new_user()`**: Automatically inserts a new row into `public.profiles` when a new user is created in `auth.users`.
- **`set_updated_at()`**: Automatically updates the `updated_at` column in `profiles` whenever a row is modified.
