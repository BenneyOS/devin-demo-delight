---
name: testing-authoring-mode
description: Test the Authoring Mode feature end-to-end in Trusted Advisor OS. Use when verifying authoring lifecycle (edit, reorder, add, archive, restore, export, discard) or checking that existing features (Study/Drill/Dashboard) are preserved.
---

# Testing Authoring Mode — Trusted Advisor OS

## Prerequisites

- Node.js installed
- Run `npm install && npm run dev` from the repo root
- App serves at `http://localhost:5173/devin-demo-delight/`
- No backend required — all state is in localStorage

## Key localStorage Keys

- `trusted-advisor-os-draft-authored` — draft content overrides (items + deletedIds)
- `trusted-advisor-os-module-order` — module ordering state
- `trusted-advisor-os-private-annotations` — private notes (never exported)

To reset all authoring state between test runs, clear these keys via browser console:
```js
localStorage.removeItem('trusted-advisor-os-draft-authored');
localStorage.removeItem('trusted-advisor-os-module-order');
localStorage.removeItem('trusted-advisor-os-private-annotations');
```

## Test Flow (Full Authoring Lifecycle)

1. **Default state**: Navigate to a module (e.g. "The Thesis"). Verify Study/Drill toggle visible, read-only cards with expand arrows, no edit controls, no PublishBanner, sidebar shows "Authoring Mode".
2. **Toggle ON**: Click "Authoring Mode" in sidebar. Verify button changes to "Authoring ON", Archive/Export sub-nav appears, EditableItem components render with Edit/Archive/Up/Down controls.
3. **Edit**: Click Edit on any item, change title, save. Verify orange border, "edited" badge, Revert button, PublishBanner with change count.
4. **Reorder**: Click down arrow on first item. Verify positions swap and banner count increases.
5. **Add item**: Scroll to bottom, click "+ Add item", enter title, click Add. Verify it appears at bottom with "Claim" confidence default.
6. **Archive**: Click Archive on an item. Verify it disappears from module, appears on Archive page with Restore/Purge buttons.
7. **Restore**: On Archive page, click Restore. Verify item returns to module list.
8. **Export**: Click "Export / Import" in sidebar, click "Export content.json". Verify JSON downloads, contains edited content, contains zero annotation/privateNote data (privacy boundary).
9. **Discard all**: Click "Discard all" on PublishBanner, confirm. Verify banner disappears, all edits reverted, added items removed, original order restored.
10. **Toggle OFF**: Click "Authoring ON" to toggle off. Verify Study/Drill toggle reappears, items expandable, Drill shows Again/Hard/Good/Easy buttons, Dashboard still renders.

## Privacy Boundary Verification

The export must never contain annotation data. To verify programmatically:
```bash
node scripts/prove-gates.mjs
```
All 13 gates should pass. Key gates:
- GA1.1-GA1.3: draft and annotations use separate localStorage keys
- GA7.1-GA7.4: export contains zero annotations
- GA9.1-GA9.3: apply-to-repo script works
- GA11.1-GA11.3: fresh visitor sees only committed content

## Common Issues

- The app uses Vite with a base path of `/devin-demo-delight/`. If the dev server URL doesn't include this path, the app may show a blank page.
- GitHub Pages deployment uses a `gh-pages` branch (not GitHub Actions). The Pages source must be set to branch `gh-pages`, folder `/ (root)`.
- After discarding drafts, the item count might differ from the original committed count if content files were modified — this is expected.
- The "Discard all" button triggers a browser `confirm()` dialog — be prepared to click OK in automated testing.

## Devin Secrets Needed

None. This is a fully static app with no authentication or external services.
