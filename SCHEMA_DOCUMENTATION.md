```md id="yxs1ul"
# FinTrack Database Schema

FinTrack uses PostgreSQL through Supabase for storing user and expense data.  
Row Level Security (RLS) is enabled to make sure users can only access their own records.

---

# Tables

## 1. profiles

Stores user profile information and budget settings.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Linked to authenticated user ID |
| `full_name` | TEXT | User's name |
| `monthly_budget` | NUMERIC(10,2) | Monthly budget amount |
| `created_at` | TIMESTAMPTZ | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last updated timestamp |

### RLS Policies
- Users can view their own profile
- Users can update their own profile

---

## 2. expenses

Stores expense transaction records for each user.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Unique expense ID |
| `user_id` | UUID | Linked user ID |
| `amount` | NUMERIC(10,2) | Expense amount |
| `category` | TEXT | Expense category |
| `payment_method` | TEXT | Payment type |
| `description` | TEXT | Optional notes |
| `expense_date` | DATE | Date of expense |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### Features
- Expenses are linked to individual users
- Categories help organize transactions
- Payment methods are stored for tracking

### RLS Policies
Users can:
- Add their own expenses
- View their own expenses
- Update their own expenses
- Delete their own expenses

---

# Database Notes

- Supabase Authentication is used for user management
- PostgreSQL is used as the database
- RLS policies are enabled for data protection
- Indexed queries are used for faster dashboard loading
```
