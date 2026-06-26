/**
 * Draft Engine — Two-Layer Content Model
 *
 * Layer 1 (Published): committed src/content/ files, the baseline.
 * Layer 2 (Draft Authored): localStorage working copy overlaying published.
 *
 * The draft layer stores edits, new items, reorders, and archive status.
 * On export, only the authored layer is emitted (no annotations).
 */

import type { ContentItem, ModuleName, ContentStatus } from '../content/schema';
import { allContent } from '../content';

const DRAFT_KEY = 'trusted-advisor-os-draft-authored';
const MODULE_ORDER_KEY = 'trusted-advisor-os-module-order';

export interface DraftState {
  items: Record<string, ContentItem>;
  deletedIds: string[];
}

function loadDraft(): DraftState {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // corrupted — start fresh
  }
  return { items: {}, deletedIds: [] };
}

function saveDraft(state: DraftState): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}

/** Get published (committed) content — the baseline from src/content/ */
export function getPublishedContent(): ContentItem[] {
  return allContent.filter(item => item.status === 'active');
}

/** Get all published content including archived */
export function getAllPublishedContent(): ContentItem[] {
  return [...allContent];
}

/**
 * Get effective content: published baseline merged with draft overrides.
 * Draft items override published items by ID.
 * New items (not in published) are included.
 * Purged items (in deletedIds) are excluded.
 */
export function getEffectiveContent(): ContentItem[] {
  const draft = loadDraft();
  const publishedMap = new Map<string, ContentItem>();

  for (const item of allContent) {
    publishedMap.set(item.id, item);
  }

  // Start with all published, apply draft overrides
  const effectiveMap = new Map<string, ContentItem>(publishedMap);

  // Apply draft edits/additions
  for (const [id, item] of Object.entries(draft.items)) {
    effectiveMap.set(id, item);
  }

  // Remove purged items
  for (const id of draft.deletedIds) {
    effectiveMap.delete(id);
  }

  return Array.from(effectiveMap.values());
}

/** Get only active effective content (excludes archived) */
export function getActiveContent(): ContentItem[] {
  return getEffectiveContent().filter(item => item.status === 'active');
}

/** Get archived items from effective content */
export function getArchivedContent(): ContentItem[] {
  return getEffectiveContent().filter(item => item.status === 'archived');
}

/** Get effective content filtered by module, sorted by order */
export function getEffectiveContentByModule(module: string): ContentItem[] {
  return getActiveContent()
    .filter(item => item.module === module)
    .sort((a, b) => a.order - b.order);
}

/** Get all module names from effective content, in order */
export function getEffectiveModules(): string[] {
  const moduleOrder = loadModuleOrder();
  const activeContent = getActiveContent();
  const modules = new Set<string>();

  for (const item of activeContent) {
    modules.add(item.module);
  }

  if (moduleOrder.length > 0) {
    const ordered: string[] = [];
    for (const m of moduleOrder) {
      if (modules.has(m)) {
        ordered.push(m);
        modules.delete(m);
      }
    }
    // Append any modules not in the saved order
    for (const m of modules) {
      ordered.push(m);
    }
    return ordered;
  }

  return Array.from(modules);
}

// --- Mutations ---

/** Save a draft edit for a single item */
export function saveDraftItem(item: ContentItem): void {
  const draft = loadDraft();
  draft.items[item.id] = {
    ...item,
    lastEditedAt: new Date().toISOString().split('T')[0],
    lastEditedBy: 'owner',
  };
  saveDraft(draft);
}

/** Reorder items within a module */
export function reorderModuleItems(_module: string, orderedIds: string[]): void {
  const draft = loadDraft();
  const effective = getEffectiveContent();

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const item = draft.items[id] || effective.find(it => it.id === id);
    if (item) {
      draft.items[id] = { ...item, order: i };
    }
  }

  saveDraft(draft);
}

/** Archive an item (reversible) */
export function archiveItem(id: string): void {
  const draft = loadDraft();
  const effective = getEffectiveContent();
  const item = draft.items[id] || effective.find(it => it.id === id);

  if (item) {
    draft.items[id] = {
      ...item,
      status: 'archived' as ContentStatus,
      lastEditedAt: new Date().toISOString().split('T')[0],
      lastEditedBy: 'owner',
    };
    saveDraft(draft);
  }
}

/** Restore an archived item */
export function restoreItem(id: string): void {
  const draft = loadDraft();
  const item = draft.items[id];

  if (item) {
    draft.items[id] = {
      ...item,
      status: 'active' as ContentStatus,
      lastEditedAt: new Date().toISOString().split('T')[0],
      lastEditedBy: 'owner',
    };
    saveDraft(draft);
  }
}

/** Purge an item permanently (removes from draft, adds to deletedIds) */
export function purgeItem(id: string): void {
  const draft = loadDraft();
  delete draft.items[id];

  // Only add to deletedIds if it's a published item
  const publishedItem = allContent.find(it => it.id === id);
  if (publishedItem) {
    if (!draft.deletedIds.includes(id)) {
      draft.deletedIds.push(id);
    }
  }

  saveDraft(draft);
}

/** Add a new content item */
export function addItem(module: ModuleName, title: string): ContentItem {
  const draft = loadDraft();
  const moduleItems = getEffectiveContentByModule(module);
  const maxOrder = moduleItems.length > 0
    ? Math.max(...moduleItems.map(i => i.order))
    : -1;

  const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString().split('T')[0];

  const item: ContentItem = {
    id,
    module,
    type: 'fact',
    title,
    body: '',
    persona: [],
    tags: [],
    confidence: 'claim',
    source: null,
    dateAdded: now,
    order: maxOrder + 1,
    status: 'active',
    lastEditedBy: 'owner',
    lastEditedAt: now,
  };

  draft.items[id] = item;
  saveDraft(draft);
  return item;
}

/** Add a new module with an initial item */
export function addModule(moduleName: string): ContentItem {
  const moduleOrder = loadModuleOrder();
  if (!moduleOrder.includes(moduleName)) {
    moduleOrder.push(moduleName);
    saveModuleOrder(moduleOrder);
  }

  return addItem(moduleName as ModuleName, 'New Item');
}

/** Revert a single item to its published version */
export function revertItem(id: string): void {
  const draft = loadDraft();
  delete draft.items[id];

  // Also remove from deletedIds if present
  draft.deletedIds = draft.deletedIds.filter(did => did !== id);

  saveDraft(draft);
}

/** Discard all drafts — reset to published baseline */
export function discardAllDrafts(): void {
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(MODULE_ORDER_KEY);
}

// --- Diff / Status ---

export interface DraftDiff {
  editedIds: string[];
  addedIds: string[];
  archivedIds: string[];
  purgedIds: string[];
  reorderedModules: string[];
}

/** Calculate what's different between draft and published */
export function getDraftDifferences(): DraftDiff {
  const draft = loadDraft();
  const publishedMap = new Map<string, ContentItem>();

  for (const item of allContent) {
    publishedMap.set(item.id, item);
  }

  const editedIds: string[] = [];
  const addedIds: string[] = [];
  const archivedIds: string[] = [];
  const reorderedModules: string[] = [];

  for (const [id, draftItem] of Object.entries(draft.items)) {
    const published = publishedMap.get(id);
    if (!published) {
      // New item
      if (draftItem.status === 'archived') {
        archivedIds.push(id);
      } else {
        addedIds.push(id);
      }
    } else if (draftItem.status === 'archived' && published.status === 'active') {
      archivedIds.push(id);
    } else {
      // Check if actually edited
      const changed = draftItem.title !== published.title
        || draftItem.body !== published.body
        || draftItem.order !== published.order
        || draftItem.confidence !== published.confidence
        || JSON.stringify(draftItem.tags) !== JSON.stringify(published.tags)
        || JSON.stringify(draftItem.persona) !== JSON.stringify(published.persona)
        || JSON.stringify(draftItem.source) !== JSON.stringify(published.source)
        || draftItem.type !== published.type;

      if (changed) {
        editedIds.push(id);
      }

      // Check reorder
      if (draftItem.order !== published.order) {
        if (!reorderedModules.includes(draftItem.module)) {
          reorderedModules.push(draftItem.module);
        }
      }
    }
  }

  return {
    editedIds,
    addedIds,
    archivedIds,
    purgedIds: draft.deletedIds,
    reorderedModules,
  };
}

/** Check if there are any unpublished changes */
export function hasDraftChanges(): boolean {
  const diff = getDraftDifferences();
  return diff.editedIds.length > 0
    || diff.addedIds.length > 0
    || diff.archivedIds.length > 0
    || diff.purgedIds.length > 0;
}

/** Count total unpublished changes */
export function countDraftChanges(): number {
  const diff = getDraftDifferences();
  return diff.editedIds.length + diff.addedIds.length + diff.archivedIds.length + diff.purgedIds.length;
}

/** Check if a specific item has been edited from published */
export function isItemEdited(id: string): boolean {
  const draft = loadDraft();
  return id in draft.items;
}

// --- Module Order ---

function loadModuleOrder(): string[] {
  try {
    const stored = localStorage.getItem(MODULE_ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveModuleOrder(order: string[]): void {
  localStorage.setItem(MODULE_ORDER_KEY, JSON.stringify(order));
}

export function reorderModules(orderedModules: string[]): void {
  saveModuleOrder(orderedModules);
}
