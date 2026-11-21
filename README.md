# Kairos - Terminal Habit Tracker

A keyboard-centric habit tracker featuring a terminal-style interface, local-first storage, and optional cloud synchronization.

## Features

- **Local-First Persistence**: Data is stored locally in the browser using IndexedDB. No account required to get started.
- **Optional Cloud Sync**: Connect to Supabase for multi-device data backup with row-level security.
- **Multiple Habit Types**:
  - Binary checkboxes for daily check-ins
  - Numeric counters for quantity targets
  - Integrated focus timer for time-based habits
- **Keyboard Navigation**: Global command palette and hotkeys for rapid navigation.
- **Visual Analytics**: Activity heatmap, completion trends, and consistency metrics.
- **Customizable Themes**: Multiple color themes with retro CRT scanline options and optional synthesized audio cues.
- **Data Portability**: Full JSON backup and restore, plus CSV export.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database (Local)**: IndexedDB (`idb`)
- **Database (Cloud)**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo-name>.git

# Navigate into the project directory
cd habits

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The compiled output will be generated inside the `dist/` directory.

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

## License

This project is open-source under the MIT License.
