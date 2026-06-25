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
├── engine/           # SM-2 spaced repetition scheduler
├── components/       # Reusable primitives (Card, Badge, DrillCard, etc.)
├── modules/          # Module views (Study + Drill, data-driven)
├── presenter/        # Presenter Mode (stripped live-reference view)
├── hooks/            # useTheme, useLocalStorage, useNotes
└── App.tsx           # Router, navigation, layout
```

### Key Design Principles

- **Content/structure separation**: All content lives in `src/content/`. The UI renders whatever is in those files. Adding a fact = adding an object to an array.
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
- **Dark/Light Mode**: System preference + manual toggle
- **Responsive**: Desktop-first, fully usable on mobile
- **Accessible**: Semantic HTML, keyboard navigable, WCAG AA contrast
