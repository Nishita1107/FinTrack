#  FinTrack — Personal Expense Tracker

FinTrack is a premium, modern personal finance manager designed to help students and professionals track their daily spending, set budgets, and visualize their financial trends. Built on a robust tech stack of **React, Vite, TanStack Router, TailwindCSS, and Supabase**, the app offers a lightning-fast experience with comprehensive local-storage fallback systems for quick test runs and demo presentations.

 **Live Demo:** [fintrack-app-nu.vercel.app](https://fintrack-app-nu.vercel.app)

---

##  Features

*   ** Secure Authentication:** Implemented via Supabase Auth. Sign up, log in, or use the interactive inline password recovery flow.
*   ** Live Dashboard:** View your monthly spending, track savings, see budget progress bars, and check financial advice tips.
*   ** Transaction Management:** Log a new expense (amount, category, description, date, payment method), view complete history, edit details, or delete entries.
*   ** Monthly Budget Override:** Set a default budget on your profile, or configure custom monthly budget overrides to adapt to seasonal spend.
*   ** Visual Analytics:** Track your top categories and view interactive charts showing spending distribution.
*   ** CSV Export:** Download your entire filtered transaction history as a standard CSV report with one click.
*   ** Demo Mode & LocalStorage Database Fallback:** Bypasses cloud constraints in test scenarios. Resetting a password automatically logs the user into a simulated local session, saving profiles, expenses, and budgets to the browser's `localStorage` so the app remains fully functional.

---

##  Tech Stack

### Frontend
*   **Framework:** React (Vite-powered SPA)
*   **Routing:** TanStack Router (File-based routing)
*   **State Management & Data Fetching:** TanStack Query (React Query)
*   **Styling:** TailwindCSS & Lucide Icons
*   **UI Components:** Radix UI primitives & Shadcn components
*   **Form Validation:** React Hook Form & Zod

### Backend & Database
*   **Auth & Backend-as-a-Service:** Supabase GoTrue Auth
*   **Database:** PostgreSQL with Row-Level Security (RLS) policies

---

## Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Nishita1107/FinTrack.git
cd FinTrack/frontend
```

### 2. Configure Environment Variables
Create a `.env` file (or `.env.local`) in the `frontend` directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

##  Project Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI components (buttons, cards, password inputs)
│   ├── hooks/            # Mobile responsive & custom state hooks
│   ├── integrations/     # Supabase client declarations and typings
│   ├── lib/              # Contexts (Auth), expense constants & validators
│   ├── routes/           # TanStack file-based routes (Dashboard, History, Add, Profile)
│   ├── main.tsx          # App bootstrapper
│   └── styles.css        # Core Tailwind CSS imports
├── package.json
└── vite.config.ts
```

---

## ⚙️ Development Scripts

*   `npm run dev` - Starts the Vite dev server with hot module replacement (HMR).
*   `npm run build` - Compiles and builds the production-ready build bundle in the `dist` directory.
*   `npm run lint` - Runs ESLint to check for code issues and rule violations.
*   `npm run format` - Uses Prettier to automatically format formatting, code style, and line-endings.

---

## Security & Demo Considerations
The app uses Supabase Row-Level Security (RLS) to ensure that users can only view, edit, or delete their own data. 

For offline presentations, testing, or review without active database environment variables, the app will enter a simulated **Demo Mode** on password resets, creating a mock session and using an intelligent `localStorage` fallback wrapper. This ensures that features like adding, updating, or deleting transactions work seamlessly in the browser.
