# Kairos - Terminal Habit Tracker

A keyboard-centric habit tracker featuring a terminal-style interface, local-first storage, optional cloud synchronization, and native desktop app support.

---

## Features

- **Local-First Persistence**: Data is stored locally using IndexedDB with zero mandatory cloud dependencies.
- **Optional Cloud Sync**: Connect to Supabase for multi-device data backup with row-level security.
- **Desktop Application**: Run natively on Windows, macOS, or Linux powered by Electron.
- **Progressive Web App (PWA)**: Installable directly from the browser on mobile and desktop.
- **Multiple Habit Types**:
  - Binary checkboxes for daily check-ins
  - Numeric counters for quantity targets
  - Integrated focus timer for time-based habits
- **Keyboard Navigation**: Global command palette and hotkeys for rapid navigation.
- **Visual Analytics**: Activity heatmap, completion trends, and consistency metrics.
- **Data Portability**: Full JSON backup and restore, plus CSV export.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Desktop Runtime**: Electron
- **Styling**: Tailwind CSS
- **Database (Local)**: IndexedDB (`idb`)
- **Database (Cloud)**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/amanshusharma999/habits.git

# Navigate into the project directory
cd habits

# Install dependencies
npm install
```

### Web Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Desktop App (Electron)

```bash
# Run desktop app in development
npm run electron:dev

# Package desktop installer for Windows (.exe)
npm run electron:build
```

### Production Web Build & Tests

```bash
# Run unit tests
npm test

# Build optimized web bundle
npm run build
```

---

## Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `0` or `D` | Switch to Habits Dashboard |
| `1` or `R` | Switch to Routines Manager |
| `2` or `A` | Switch to Analytics View |
| `3` or `C` | Switch to Calendar View |
| `N` | Open New Habit dialog |
| `Ctrl + K` or `/` | Open Command Palette |
| `?` | Show Keyboard Shortcuts |
| `S` | Open Settings |
| `M` | Toggle audio effects |
| `T` | Toggle CRT screen effect |
| `Esc` | Close open modal |

---

## Environment Configuration (Optional)

To enable cloud synchronization with Supabase:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run the schema migrations from `supabase/schema.sql` in your Supabase SQL editor.

---

## Author

Crafted with dedication by **[Amanshu Sharma](https://github.com/amanshusharma999)**.

---

## License

This project is open-source under the MIT License.
