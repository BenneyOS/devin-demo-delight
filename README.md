# Trusted Advisor OS

A personal learning and performance environment for preparing elite enterprise sales presentations. Built with React, TypeScript, and Vite. Content is stored in Supabase (hosted Postgres) for live editing — changes are visible immediately to all visitors.

## Live Demo

**[https://benneyos.github.io/devin-demo-delight/](https://benneyos.github.io/devin-demo-delight/)**

## Architecture

```
src/
├── content/          # Content types + static baseline (legacy, kept for reference)
│   ├── schema.ts     # TypeScript types + runtime validator
│   └── index.ts      # Type re-exports
├── engine/
│   └── sm2.ts        # SM-2 spaced repetition scheduler (Supabase-backed)
├── lib/
│   └── supabase.ts   # Supabase client singleton (owner-key header injection)
├── hooks/
│   ├── useSupabaseContent.tsx  # Main data layer (replaces localStorage draft engine)
│   ├── useNotes.ts             # Annotations (Supabase-backed)
│   └── useTheme.ts
├── components/
│   ├── EditableItem.tsx   # Inline editing with blur/debounce saves
│   ├── ArchiveDrawer.tsx  # Archived items management
│   ├── BackupExport.tsx   # JSON backup download
│   └── OwnerKeyPrompt.tsx # Owner edit-key entry modal
├── modules/          # Module views (Study + Drill + Authoring)
├── presenter/        # Presenter Mode (stripped live-reference view)
└── App.tsx           # Router, navigation, layout
```

### Live Backend

All content lives in Supabase (hosted Postgres). Edits are immediately visible to all viewers — no commit, redeploy, or publish step.

- **Reads**: All visitors can view content (public `SELECT` via RLS)
- **Writes**: Gated by a single owner edit-key (stored in browser localStorage, passed as `x-owner-key` header)
- **Saves**: Fire on field blur or after 300ms debounce — never per-keystroke
- **Optimistic UI**: Edits apply locally immediately; on failure, the field rolls back and an error toast appears
- **Real-time**: Supabase Realtime pushes changes to already-open pages

### Owner Edit-Key Flow

1. Click **Authoring Mode** in the sidebar
2. Enter your edit key when prompted (one-time; stored in localStorage)
3. Edit, reorder, add, or archive items — changes are live immediately
4. Click **Forget edit key** to log out

Without the edit key, the app is read-only.

### How to Set/Rotate the Owner Edit Key

The owner edit key is stored in the `app_settings` table:

```sql
UPDATE app_settings SET value = 'your-new-secret-key' WHERE key = 'owner_edit_key';
```

## Content Schema

Every content item conforms to this schema:

```typescript
{
  id: "guarantee-validation",
  module: "thesis",
  type: "fact" | "question" | "objection" | "card" | "source" | "story-beat",
  title: "How the guarantee is validated",
  body: "...",
  persona: ["CIO"] | ["CTO","Security"] | [],
  tags: ["guarantee", "outcome-pricing"],
  confidence: "verified" | "inferred" | "claim",
  source: { label: "devin.ai/guarantee", url: "https://..." } | null,
  dateAdded: "2026-06-25"
}
```

## Running Locally

```bash
npm install
npm run dev       # Development server at localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Tech Stack

- React 19 + TypeScript
- Vite 8 (static build output, deployed to GitHub Pages)
- Supabase (hosted Postgres + Realtime + RLS)
- CSS custom properties for theming (dark/light)
- Inter + Newsreader fonts

## Features

- **Dashboard**: Due today, weakest areas, learning path progress, interview countdown
- **Study View**: Progressive disclosure, confidence badges, reflection notes
- **Drill View**: Active recall with SM-2 scheduling (Again/Hard/Good/Easy)
- **Presenter Mode**: Stripped live-reference view with persona filtering
- **Source Library**: Auto-aggregated, filterable, sortable
- **Authoring Mode**: Live in-app editing with owner edit-key access control
- **Backup Export**: Download JSON snapshot of all content
- **Real-time Sync**: Changes appear on all open browsers without refresh
- **Dark/Light Mode**: System preference + manual toggle
- **Responsive**: Desktop-first, fully usable on mobile
- **Accessible**: Semantic HTML, keyboard navigable, WCAG AA contrast

## Supabase Setup (for contributors)

The app connects to a Supabase project. The anon key is embedded in the client (safe — RLS protects writes). To set up your own instance:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema migration in `scripts/migrate-to-supabase.ts`
3. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `src/lib/supabase.ts`
4. Set your owner edit key in the `app_settings` table
