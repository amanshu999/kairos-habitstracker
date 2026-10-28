# init.habits >_ Terminal-Inspired Habit Tracker

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> A minimalist, terminal-inspired habit tracker built for students, developers, and high-performers striving for ruthless consistency and uninterrupted flow.
> Inspired by the terminal aesthetic of init.Habits, built as an original, fully-featured implementation with its own branding, identity, local-first architecture, and cloud sync.

---

## ⚡ Core Highlights

- **Obsidian Terminal Aesthetic**: Monospace typography (`JetBrains Mono`), dark charcoal backgrounds, subtle borders, phosphor green/cyan/amber accents, retro CRT raster scanline option, and 8-bit mechanical audio synthesis.
- **Local-First Architecture**: Powered by `IndexedDB` (`idb`). Operates 100% offline out-of-the-box with zero mandatory sign-in or cloud dependencies.
- **Cloud Sync & Supabase PostgreSQL**: Optional cloud synchronization with Row-Level Security (RLS) policies ensuring users own and access only their private data.
- **Three Tracking Modes**:
  1. **Checkbox (`boolean`)**: Classic binary daily habit (e.g., git commits, documentation reading).
  2. **Numeric Counter (`numeric`)**: Track targets with step buttons and ASCII progress bars (e.g., 8 glasses of water, 100 pushups).
  3. **Stopwatch / Timer (`timer`)**: Interactive focus timer with countdown, live seconds ticker, and completion alarms (e.g., 45-min Deep Work block).
- **Rock-Solid Streak System**: Consecutive day tracking accurately handling today's pending state vs. completed state, timezones, missed days, and streak shield tokens.
- **Sequential Routines & Focus Runner**: Group habits into named pipelines (e.g., "Morning Boot Sequence", "Deep Work Sprint") and execute them step-by-step in an immersive focus overlay.
- **GitHub-Style Contribution Heatmap**: Visual matrix tracking daily completion velocity across 20 weeks with 5 intensity levels.
- **Velocity Trends & Leaderboards**: Interactive Recharts graphs showing 30/60/90-day completion rates, weekday consistency, and category distribution.
- **Interactive Calendar Audit**: Monthly grid with day breakdown (full, partial, missed) and retroactive log inspection & editing.
- **Multi-Palette Theme Engine**: Switch on the fly between **Terminal Emerald**, **Matrix Phosphor Green**, **Dracula Midnight**, **Nord Polar**, and **Amber CRT Vintage**.
- **Keyboard-First Navigation**: Global command palette (`Ctrl+K` or `/`), hotkeys (`0`/`1`/`2`/`3` for tabs, `N` for new habit, `M` for audio toggle, `?` for cheat sheet).
- **Data Portability**: Full JSON backup export & restore, plus spreadsheet-ready CSV export.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | Declarative component UI |
| **TypeScript** | Strict type safety and data modeling |
| **Vite** | Ultra-fast bundling and development |
| **Tailwind CSS** | Custom terminal design system with CSS custom properties |
| **Lucide React** | Crisp developer icons |
| **IndexedDB (`idb`)** | Client-side persistent database for offline-first usage |
| **Recharts** | Reactive analytics charts and velocity trends |
| **Canvas Confetti** | Celebratory streak and routine completion effects |
| **Web Audio API** | Real-time retro 8-bit sound synthesis (zero external audio files) |
| **Supabase Client** | Cloud persistence with PostgreSQL and Row-Level Security |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** or **pnpm**

### 2. Clone and Install
```bash
git clone <repo-url>
cd habits
npm install
```

### 3. Run Locally in Development
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser. The application will automatically initialize IndexedDB with sample developer habits and 60 days of historical logs so all heatmaps and streak charts are active immediately!

### 4. Build for Production
```bash
npm run build
```
The optimized bundle is output to `dist/`, ready to deploy to Vercel, Netlify, or any static hosting service.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `0` or `D` | Switch to **Habits Dashboard** |
| `1` or `R` | Switch to **Routines Manager** |
| `2` or `A` | Switch to **Analytics & Metrics** |
| `3` or `C` | Switch to **Calendar Audit** |
| `N` | Quick Add New Habit modal |
| `Ctrl+K` or `/` | Open **Terminal Command Palette** |
| `?` | Open **Keyboard Shortcuts Cheat Sheet** |
| `S` | Open **Settings & Preferences** |
| `M` | Toggle **8-Bit Audio Synthesizer** (Mute/Unmute) |
| `T` | Toggle **CRT Scanlines Monitor Effect** |
| `Ctrl+Enter` | Save / Commit modal form |
| `Esc` | Close any open modal or command palette |

---

## ☁️ Supabase Cloud Setup (Optional)

`init.habits` is built local-first and requires **no external setup** to use. If you want multi-device synchronization and cloud backups:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](file:///d:/My%20Projects/habits/supabase/schema.sql). This configures:
   - `profiles` table
   - `habits` table
   - `habit_logs` table (with unique constraints per user, habit, and date)
   - `routines` table
   - Row-Level Security (RLS) policies allowing users to only read/write their own records.
4. Copy your **Project URL** and **Anon Key** from `Project Settings > API`.
5. You can configure them in two ways:
   - Create a `.env` file from `.env.example`:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - OR paste them directly in the application UI under **Settings (`S`) > SUPABASE_CLOUD**.

---

## 🌐 Vercel Deployment

This project is 100% Vercel-compatible:
1. Push your repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. (Optional) Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables if using cloud sync.
7. Click **Deploy**.

---

## 🔒 Privacy & Data Ownership

- All your habits, streaks, and historical records are stored locally in your browser's IndexedDB.
- You can export your data at any time via **Settings > Data & Export**:
  - `EXPORT_JSON`: Complete backup file containing all habits, logs, routines, and user settings.
  - `EXPORT_CSV`: Spreadsheet-compatible CSV of all historical logs.
- You can restore your data on any device via `IMPORT_JSON_BACKUP`.

---

## 📜 License

MIT License. Designed and developed with pride.
