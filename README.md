# FinTrack — Personal Expense Tracker

FinTrack is a personal expense tracking web application built using **React, Vite, TanStack Router, Tailwind CSS, and Supabase**. It helps users manage daily expenses, set monthly budgets, monitor spending habits, and visualize financial insights through an intuitive dashboard.

**Live Demo:** https://fintrack-app-nu.vercel.app

---

## Features

- **Secure Authentication:** User authentication powered by Supabase Auth with login, signup, and inline password reset functionality.
- **Interactive Dashboard:** Track monthly spending, monitor savings, view budget progress, and access financial summaries.
- **Expense Management:** Add, edit, delete, and organize expenses with categories, descriptions, payment methods, and dates.
- **Budget Management:** Set a default monthly budget and create custom budget overrides for individual months.
- **Analytics:** Visualize spending trends and category-wise expense distribution using interactive charts.
- **CSV Export:** Export filtered transaction history as a CSV file.
- **Demo Mode:** Supports LocalStorage-based data storage for testing and offline demonstrations when Supabase is unavailable.

---

## Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Routing:** TanStack Router
- **State Management:** TanStack Query
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI & shadcn/ui
- **Icons:** Lucide React
- **Form Handling:** React Hook Form
- **Validation:** Zod

### Backend & Database
- **Backend:** Supabase
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL
- **Security:** Row-Level Security (RLS)

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Nishita1107/FinTrack.git
cd FinTrack/frontend
```

### 2. Configure Environment Variables

Create a `.env` file inside the `frontend` directory.

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase configuration
│   ├── lib/              # Utilities, validators & contexts
│   ├── routes/           # Application routes
│   ├── main.tsx
│   └── styles.css
├── package.json
└── vite.config.ts
```

---

## Available Scripts

- `npm run dev` – Starts the development server.
- `npm run build` – Builds the application for production.
- `npm run lint` – Runs ESLint to identify code issues.
- `npm run format` – Formats the project using Prettier.

---

## Security

FinTrack uses **Supabase Authentication** and **PostgreSQL Row-Level Security (RLS)** to ensure users can only access and manage their own data.

For testing and demonstrations, the application also includes a **LocalStorage-based Demo Mode**, allowing core features such as authentication, expense management, budgeting, and analytics to work without an active Supabase connection.

---

## Future Enhancements

- Income tracking
- Recurring transactions
- Receipt uploads
- Spending insights
- Multi-currency support
- Dark mode
