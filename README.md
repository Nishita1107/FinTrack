# FinTrack — Personal Expense Tracker

FinTrack is a personal expense tracking web application built using **React, Vite, TanStack Router, Tailwind CSS, and Supabase**. It was developed to help users manage their daily expenses, set monthly budgets, and keep track of their spending through a simple and responsive interface.

**Live Demo:** https://fintrack-app-nu.vercel.app

---

## Features

* **Secure Authentication:** Sign up, log in, and reset passwords using Supabase Auth.
* **Dashboard:** View monthly expenses, savings, budget progress, and spending summaries.
* **Expense Management:** Add, edit, and delete transactions with categories, payment methods, descriptions, and dates.
* **Budget Tracking:** Set a monthly budget and create custom budget overrides whenever needed.
* **Expense Analytics:** View spending trends and category-wise distribution through charts.
* **CSV Export:** Export your transaction history as a CSV file.
* **Demo Mode:** Uses LocalStorage to allow the application to work without a Supabase connection during testing or demonstrations.

---

## Tech Stack

### Frontend

* **Framework:** React (Vite)
* **Routing:** TanStack Router
* **State Management:** TanStack Query
* **Styling:** Tailwind CSS
* **UI Components:** shadcn/ui & Radix UI
* **Icons:** Lucide React
* **Forms & Validation:** React Hook Form + Zod

### Backend & Database

* **Backend:** Supabase
* **Authentication:** Supabase Auth
* **Database:** PostgreSQL
* **Security:** Row-Level Security (RLS)

---

## Getting Started

### Prerequisites

* Node.js (v18 or later)
* npm

### 1. Clone the Repository

```bash
git clone https://github.com/Nishita1107/FinTrack.git
cd FinTrack/frontend
```

### 2. Configure Environment Variables

Create a `.env` file inside the `frontend` folder and add:

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

## Project Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase configuration
│   ├── lib/              # Utilities, validation & context
│   ├── routes/           # Application routes
│   ├── main.tsx
│   └── styles.css
├── package.json
└── vite.config.ts
```

---

## Available Scripts

* `npm run dev` – Starts the development server.
* `npm run build` – Creates a production build.
* `npm run lint` – Checks the code using ESLint.
* `npm run format` – Formats the code using Prettier.

---

## Notes

* Authentication is handled using Supabase Auth.
* PostgreSQL Row-Level Security (RLS) ensures users can only access their own data.
* Demo Mode stores data in the browser using LocalStorage, making it easy to test the application without setting up Supabase.

---

## Future Improvements

* Income tracking
* Recurring transactions
* Receipt uploads
* Better expense insights
* Multi-currency support
* Dark mode
