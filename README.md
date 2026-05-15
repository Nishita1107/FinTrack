# FinTrack - Full-Stack Personal Finance Tracker

FinTrack is a comprehensive, responsive, and beautifully designed full-stack web application built to help users seamlessly track their income, expenses, and monthly budgets.

## Features
- **User Authentication:** Secure sign up, login, and logout flow using Supabase Auth.
- **Dashboard:** At-a-glance overview of income, expenses, balance, and recent activity.
- **Transactions Management:** Add, edit, delete, and categorize transactions.
- **Budgeting & Alerts:** Set monthly budgets and track spending with visual progress indicators.
- **Analytics:** Visualize spending patterns using interactive Recharts graphs.

## Tech Stack
### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router (TanStack Router)
- Recharts
- Lucide React (Icons)

### Backend
- Supabase (PostgreSQL Database)
- Supabase Auth (JWT)
- Row-Level Security (RLS) for protected data

## Getting Started

### Prerequisites
- Node.js >= 20
- npm or yarn
- Supabase Project

### 1. Backend Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com/).
2. Link your project via the Supabase CLI, or apply the migrations in `backend/supabase/migrations/` to your database.
3. Obtain your `Project URL` and `Anon Public Key` from the Supabase dashboard.

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory and add your Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.

## Deployment
- **Frontend:** Easily deployable to Vercel. Connect your repository and select Vite as the framework.
- **Backend:** Hosted and managed via Supabase.

## Project Structure
```
FinTrack/
├── frontend/             # React SPA (Vite + Tailwind + Tanstack Router)
│   ├── src/              # Application source code
│   ├── public/           # Static assets
│   ├── index.html        # Main HTML entry
│   └── package.json      # Frontend dependencies
├── backend/              # Supabase Backend configuration
│   └── supabase/         # Migrations and schema configuration
├── API_DOCUMENTATION.md  # Detailed API specifications
└── SCHEMA_DOCUMENTATION.md # SQL/Database schema details
```
