# FinTrack

FinTrack is a personal expense tracking web application that helps users manage daily expenses, monitor monthly budgets, and gain insights into their spending habits through interactive analytics.

**Live Demo → [fintrack-app-nu.vercel.app](https://fintrack-app-nu.vercel.app)**

---

## Features

- Secure user authentication via Supabase
- Add, edit, and delete expense transactions
- Categorize and filter expenses for better organization
- Set and track monthly budget limits
- Interactive charts and analytics dashboard
- Fully responsive UI across all devices

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Routing | TanStack Router |
| Charts | Recharts |
| Backend | Supabase, PostgreSQL |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18 or above
- npm
- A Supabase project — [create one here](https://supabase.com/)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Nishita1107/FinTrack.git
cd FinTrack
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the root directory and add the following:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Start the development server**
```bash
npm run dev
```

The app will be running at [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
FinTrack/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client configuration
│   └── types/          # TypeScript type definitions
├── public/
└── supabase/           # Database schema and migrations
```

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or raise an issue.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Verify the project structure section against your actual folders and update accordingly — baaki sab production ready hai.
