# Trusted Advisor OS

A personal learning and performance environment for preparing elite enterprise sales presentations. Built with React, TypeScript, and Vite — deployable as a static site on GitHub Pages.

## Live Demo

**[https://benneyos.github.io/devin-demo-delight/](https://benneyos.github.io/devin-demo-delight/)**

## Architecture

```
src/
├── content/          # Data layer — one file per module
│   ├── schema.ts     # TypeScript types + runtime validator
│   ├── thesis.ts     # The Thesis module content
│   ├── accountIntel.ts
│   ├── repoRationale.ts
│   ├── discovery.ts
│   ├── devinNarrative.ts
│   ├── competitive.ts
│   ├── mastery.ts
│   └── index.ts      # Aggregation + "HOW TO ADD A SOURCE" guide
├── engine/
│   ├── sm2.ts        # SM-2 spaced repetition scheduler
│   ├── draft.ts      # Two-layer draft engine (published baseline + localStorage overrides)
│   ├── annotations.ts # Private notes engine (localStorage, never exported)
│   └── exportImport.ts # Export/import authored content (zero annotations)
├── components/       # Reusable primitives (Card, Badge, DrillCard, etc.)
│   ├── EditableItem.tsx   # Inline editing with reorder controls
│   ├── PublishBanner.tsx  # Unpublished changes warning
│   ├── ArchiveDrawer.tsx  # Archived items management
│   └── ExportImportPanel.tsx # Export/import UI
├── modules/          # Module views (Study + Drill + Authoring, data-driven)
├── presenter/        # Presenter Mode (stripped live-reference view)
├── hooks/
│   ├── useTheme.ts
│   ├── useNotes.ts
│   └── useAuthoring.ts # Authoring mode context + state management
├── scripts/
│   ├── apply-content.mjs  # Build-time: reads export JSON → writes src/content/ files
│   └── prove-gates.mjs    # Automated privacy boundary verification (13 gates)
└── App.tsx           # Router, navigation, layout
```

### Two-Layer Content Model

The app uses a two-layer architecture for content authoring:

1. **Published layer** (`src/content/` files): The committed baseline. Deployed via GitHub Pages. This is the source of truth.
2. **Draft layer** (localStorage `trusted-advisor-os-draft-authored`): Local overrides — edits, new items, archives, reorders. Never touches the repo directly.

A third, completely isolated layer stores **private annotations** (localStorage `trusted-advisor-os-private-annotations`). These are never exported, never mixed with authored content — guaranteed by automated gate tests.

### Publish Workflow

Edits live in localStorage until you explicitly publish:

1. Toggle **Authoring Mode** in the sidebar
2. Edit, reorder, add, or archive items
3. Go to **Export / Import** → click **Export content.json**
4. Run `node scripts/apply-content.mjs content.export.json` to write `src/content/` files
5. Commit and push — the site redeploys automatically

### Key Design Principles

- **Content/structure separation**: All content lives in `src/content/`. The UI renders whatever is in those files. Adding a fact = adding an object to an array.
- **Privacy boundary**: Private annotations never leave localStorage. Export produces only authored content. Verified by 13 automated gate tests (`node scripts/prove-gates.mjs`).
- **EdTech mechanics**: Active recall (hide/reveal drills), SM-2 spaced repetition, confidence tracking, reflection notes.
- **Data-driven**: Every module view is the same component rendering different content. Zero layout code changes needed to add content.
- **Offline-first**: All state in localStorage. No external dependencies at runtime.

## Content Schema

Every content item conforms to this schema:

```typescript
{
  id: "guarantee-validation",          // unique, kebab-case
  module: "thesis",                     // which module it belongs to
  type: "fact" | "question" | "objection" | "card" | "source" | "story-beat",
  title: "How the guarantee is validated",
  body: "...",                          // markdown allowed
  persona: ["CIO"] | ["CTO","Security"] | [],
  tags: ["guarantee", "outcome-pricing"],
  confidence: "verified" | "inferred" | "claim",
  source: { label: "devin.ai/guarantee", url: "https://..." } | null,
  dateAdded: "2026-06-25"
}
```

## How to Add Content

1. Open the relevant module file in `src/content/`
2. Add a new object to the array (see the HOW TO ADD A SOURCE guide in `src/content/index.ts`)
3. Save. The UI renders it automatically.

Time to add: ~30 seconds.

## Running Locally

```bash
npm install
npm run dev       # Development server at localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## Tech Stack

- React 19 + TypeScript
- Vite 8 (static build output)
- CSS custom properties for theming (dark/light)
- Inter + Newsreader fonts
- localStorage for all persistence
- Zero runtime dependencies beyond React

## Features

- **Dashboard**: Due today, weakest areas, learning path progress, interview countdown
- **Study View**: Progressive disclosure, confidence badges, reflection notes
- **Drill View**: Active recall with SM-2 scheduling (Again/Hard/Good/Easy)
- **Presenter Mode**: Stripped live-reference view with persona filtering
- **Source Library**: Auto-aggregated, filterable, sortable
- **Authoring Mode**: In-app editing, reordering, add/archive items, export/import workflow
- **Privacy Boundary**: Private annotations isolated from authored content (13 automated gate tests)
- **Dark/Light Mode**: System preference + manual toggle
- **Responsive**: Desktop-first, fully usable on mobile
- **Accessible**: Semantic HTML, keyboard navigable, WCAG AA contrast
