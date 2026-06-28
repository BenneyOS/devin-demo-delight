/**
 * Supabase Content Provider — replaces the localStorage draft layer.
 *
 * All reads come from Supabase; writes go to Supabase with owner-key header.
 * Realtime subscriptions push changes to already-open pages.
 * Optimistic UI: apply locally, rollback + toast on failure.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import type { ContentItem, ContentType, Confidence, Persona, ModuleName, ContentStatus } from '../content/schema';
import { supabase, getOwnerKey, setOwnerKey, clearOwnerKey } from '../lib/supabase';
import { initStudyState } from '../engine/sm2';

// ── DB row types ──

interface DbModule {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: string;
}

interface DbContentItem {
  id: string;
  module_id: string;
  type: string;
  title: string;
  body: string;
  persona: string[];
  tags: string[];
  confidence: string;
  source_label: string | null;
  source_url: string | null;
  order: number;
  status: string;
  date_added: string | null;
  last_edited_by: string;
  updated_at: string;
  pre_archive_status: string | null;
}

export interface ModuleObject {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: string;
}

// ── Mappers ──

function dbItemToContentItem(row: DbContentItem, moduleSlug: string): ContentItem {
  return {
    id: row.id,
    module: moduleSlug as ModuleName,
    type: row.type as ContentType,
    title: row.title,
    body: row.body,
    persona: row.persona as Persona[],
    tags: row.tags,
    confidence: row.confidence as Confidence,
    source: row.source_label && row.source_url
      ? { label: row.source_label, url: row.source_url }
      : null,
    dateAdded: row.date_added || '',
    order: row.order,
    status: row.status as ContentStatus,
    lastEditedBy: row.last_edited_by,
    lastEditedAt: row.updated_at?.split('T')[0] || '',
  };
}

// ── Error toast helper ──

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showErrorToast(msg: string) {
  const existing = document.getElementById('supabase-error-toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'supabase-error-toast';
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    background: '#ef4444',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '99999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth: '400px',
  });
  document.body.appendChild(el);

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.remove(), 5000);
}

// ── Context type ──

interface SupabaseContentState {
  loading: boolean;
  error: string | null;

  // Content
  allContent: ContentItem[];
  activeContent: ContentItem[];
  archivedContent: ContentItem[];
  modules: string[];
  moduleObjects: ModuleObject[];
  allModuleObjects: ModuleObject[];
  archivedModules: ModuleObject[];
  getModuleItems: (module: string) => ContentItem[];
  getContentByModule: (module: string) => ContentItem[];
  getDrillableItems: () => ContentItem[];
  getSourceItems: () => ContentItem[];
  getContentByPersona: (persona: string) => ContentItem[];
  getModuleItemCount: (moduleId: string) => number;

  // Authoring
  isAuthoring: boolean;
  toggleAuthoring: () => void;
  isOwner: boolean;
  ownerKeyPromptOpen: boolean;
  submitOwnerKey: (key: string) => Promise<boolean>;
  logout: () => void;

  // CRUD (writes to Supabase)
  saveItem: (item: ContentItem) => void;
  reorderItems: (module: string, ids: string[]) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  purge: (id: string) => void;
  addNewItem: (module: string, title: string) => ContentItem;
  addNewModule: (name: string) => ContentItem;
  revert: (id: string) => void;
  discardAll: () => void;
  hasChanges: boolean;
  changeCount: number;
  isEdited: (id: string) => boolean;
  reorderModuleList: (modules: string[]) => void;
  refresh: () => void;

  // Module CRUD
  renameModule: (moduleId: string, newTitle: string) => void;
  archiveModule: (moduleId: string) => void;
  restoreModule: (moduleId: string) => void;
  purgeModule: (moduleId: string) => void;

  // Settings
  interviewAt: string | null;
  setInterviewAt: (dateStr: string) => void;
}

const SupabaseContentContext = createContext<SupabaseContentState | null>(null);

// ── Provider ──

export function SupabaseContentProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbModules, setDbModules] = useState<DbModule[]>([]);
  const [dbItems, setDbItems] = useState<DbContentItem[]>([]);
  const [isAuthoring, setIsAuthoring] = useState(false);
  const [isOwner, setIsOwner] = useState(!!getOwnerKey());
  const [ownerKeyPromptOpen, setOwnerKeyPromptOpen] = useState(false);
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [interviewAt, setInterviewAtState] = useState<string | null>(null);

  const moduleMapRef = useRef<Map<string, DbModule>>(new Map());

  // Build module maps
  useEffect(() => {
    const map = new Map<string, DbModule>();
    for (const mod of dbModules) {
      map.set(mod.id, mod);
    }
    moduleMapRef.current = map;
  }, [dbModules]);

  // ── Fetch all data ──
  const fetchData = useCallback(async () => {
    try {
      const [modRes, itemRes] = await Promise.all([
        supabase.from('modules').select('*').order('order'),
        supabase.from('content_items').select('*').order('order'),
      ]);

      if (modRes.error) throw modRes.error;
      if (itemRes.error) throw itemRes.error;

      setDbModules(modRes.data || []);
      setDbItems(itemRes.data || []);

      // Fetch interview_at setting (public read blocked by RLS on app_settings,
      // so fetch via a direct query with owner key if present, otherwise use default)
      try {
        const settingsRes = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'interview_at')
          .single();
        if (settingsRes.data?.value) {
          setInterviewAtState(settingsRes.data.value);
        }
      } catch {
        // Settings read may fail without owner key — use default
      }

      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    initStudyState();
  }, [fetchData]);

  // ── Realtime subscriptions ──
  useEffect(() => {
    const channel = supabase
      .channel('content-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'annotations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // ── Derived data ──
  const moduleIdToSlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const mod of dbModules) {
      map.set(mod.id, mod.slug);
    }
    return map;
  }, [dbModules]);

  const slugToModuleId = useMemo(() => {
    const map = new Map<string, string>();
    for (const mod of dbModules) {
      map.set(mod.slug, mod.id);
    }
    return map;
  }, [dbModules]);

  const allContent = useMemo(() => {
    return dbItems.map(row => {
      const slug = moduleIdToSlug.get(row.module_id) || 'unknown';
      return dbItemToContentItem(row, slug);
    });
  }, [dbItems, moduleIdToSlug]);

  const activeContent = useMemo(() =>
    allContent.filter(item => item.status === 'active'),
  [allContent]);

  const archivedContent = useMemo(() =>
    allContent.filter(item => item.status === 'archived'),
  [allContent]);

  const modules = useMemo(() =>
    dbModules
      .filter(m => m.status === 'active')
      .sort((a, b) => a.order - b.order)
      .map(m => m.slug),
  [dbModules]);

  const moduleObjects = useMemo<ModuleObject[]>(() =>
    dbModules
      .filter(m => m.status === 'active')
      .sort((a, b) => a.order - b.order),
  [dbModules]);

  const allModuleObjects = useMemo<ModuleObject[]>(() =>
    [...dbModules].sort((a, b) => a.order - b.order),
  [dbModules]);

  const archivedModules = useMemo<ModuleObject[]>(() =>
    dbModules.filter(m => m.status === 'archived'),
  [dbModules]);

  const getModuleItems = useCallback((module: string) =>
    activeContent
      .filter(item => item.module === module)
      .sort((a, b) => a.order - b.order),
  [activeContent]);

  const getContentByModule = useCallback((module: string) =>
    activeContent
      .filter(item => item.module === module)
      .sort((a, b) => a.order - b.order),
  [activeContent]);

  const getDrillableItems = useCallback(() =>
    activeContent.filter(item =>
      item.type === 'question' || item.type === 'objection' || item.type === 'story-beat'
    ),
  [activeContent]);

  const getSourceItems = useCallback(() =>
    activeContent.filter(item => item.source !== null),
  [activeContent]);

  const getContentByPersona = useCallback((persona: string) =>
    activeContent.filter(item => item.persona.includes(persona as Persona)),
  [activeContent]);

  const getModuleItemCount = useCallback((moduleId: string) => {
    return dbItems.filter(r => r.module_id === moduleId && r.status === 'active').length;
  }, [dbItems]);

  // ── Owner key flow ──
  const toggleAuthoring = useCallback(() => {
    if (!isAuthoring) {
      if (!isOwner) {
        setOwnerKeyPromptOpen(true);
        return;
      }
    }
    setIsAuthoring(prev => !prev);
  }, [isAuthoring, isOwner]);

  const submitOwnerKey = useCallback(async (key: string): Promise<boolean> => {
    setOwnerKey(key);
    // Verify the key by trying to read app_settings (only accessible with valid key)
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'owner_edit_key')
      .single();

    if (error || !data) {
      clearOwnerKey();
      return false;
    }

    setIsOwner(true);
    setOwnerKeyPromptOpen(false);
    setIsAuthoring(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearOwnerKey();
    setIsOwner(false);
    setIsAuthoring(false);
  }, []);

  // ── Write helpers (optimistic UI) ──

  const writeToSupabase = useCallback(async (
    operation: () => PromiseLike<{ error: unknown }>,
    rollback: () => void,
    operationName: string
  ) => {
    const result = await operation();
    if (result.error) {
      rollback();
      showErrorToast(`${operationName} failed. Change reverted.`);
      console.error(`${operationName} error:`, result.error);
      fetchData();
    }
  }, [fetchData]);

  // ── CRUD operations ──

  const saveItem = useCallback((item: ContentItem) => {
    const moduleId = slugToModuleId.get(item.module);
    if (!moduleId) return;

    const prevItems = [...dbItems];
    const updatedRow: Partial<DbContentItem> = {
      title: item.title,
      body: item.body,
      type: item.type,
      confidence: item.confidence,
      persona: item.persona,
      tags: item.tags,
      source_label: item.source?.label || null,
      source_url: item.source?.url || null,
      order: item.order,
      status: item.status,
      last_edited_by: 'owner',
    };

    // Optimistic update
    setDbItems(prev => prev.map(r => r.id === item.id ? { ...r, ...updatedRow } : r));
    setEditedIds(prev => new Set(prev).add(item.id));

    writeToSupabase(
      () => supabase.from('content_items').update(updatedRow).eq('id', item.id),
      () => setDbItems(prevItems),
      'Save item'
    );
  }, [dbItems, slugToModuleId, writeToSupabase]);

  const reorderItems = useCallback((_module: string, ids: string[]) => {
    const prevItems = [...dbItems];

    // Optimistic update
    setDbItems(prev => {
      const updated = [...prev];
      for (let i = 0; i < ids.length; i++) {
        const idx = updated.findIndex(r => r.id === ids[i]);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], order: i };
        }
      }
      return updated;
    });

    // Batch update orders
    const updates = ids.map((id, i) =>
      supabase.from('content_items').update({ order: i }).eq('id', id)
    );
    Promise.all(updates).then(results => {
      const failed = results.find(r => r.error);
      if (failed) {
        setDbItems(prevItems);
        showErrorToast('Reorder failed. Changes reverted.');
        fetchData();
      }
    });
  }, [dbItems, fetchData]);

  const archive = useCallback((id: string) => {
    const prevItems = [...dbItems];
    setDbItems(prev => prev.map(r => r.id === id ? { ...r, status: 'archived' } : r));

    writeToSupabase(
      () => supabase.from('content_items').update({ status: 'archived' }).eq('id', id),
      () => setDbItems(prevItems),
      'Archive item'
    );
  }, [dbItems, writeToSupabase]);

  const restore = useCallback((id: string) => {
    const prevItems = [...dbItems];
    setDbItems(prev => prev.map(r => r.id === id ? { ...r, status: 'active' } : r));

    writeToSupabase(
      () => supabase.from('content_items').update({ status: 'active' }).eq('id', id),
      () => setDbItems(prevItems),
      'Restore item'
    );
  }, [dbItems, writeToSupabase]);

  const purge = useCallback((id: string) => {
    const prevItems = [...dbItems];
    setDbItems(prev => prev.filter(r => r.id !== id));

    writeToSupabase(
      () => supabase.from('content_items').delete().eq('id', id),
      () => setDbItems(prevItems),
      'Delete item'
    );
  }, [dbItems, writeToSupabase]);

  const addNewItem = useCallback((module: string, title: string): ContentItem => {
    const moduleId = slugToModuleId.get(module);
    const moduleItems = activeContent.filter(i => i.module === module);
    const maxOrder = moduleItems.length > 0
      ? Math.max(...moduleItems.map(i => i.order))
      : -1;

    const id = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newRow: DbContentItem = {
      id,
      module_id: moduleId || '',
      type: 'fact',
      title,
      body: '',
      persona: [],
      tags: [],
      confidence: 'claim',
      source_label: null,
      source_url: null,
      order: maxOrder + 1,
      status: 'active',
      date_added: now.split('T')[0],
      last_edited_by: 'owner',
      updated_at: now,
      pre_archive_status: null,
    };

    // Optimistic add
    setDbItems(prev => [...prev, newRow]);

    const newItem = dbItemToContentItem(newRow, module);

    supabase.from('content_items').insert({
      id: newRow.id,
      module_id: newRow.module_id,
      type: newRow.type,
      title: newRow.title,
      body: newRow.body,
      persona: newRow.persona,
      tags: newRow.tags,
      confidence: newRow.confidence,
      source_label: newRow.source_label,
      source_url: newRow.source_url,
      order: newRow.order,
      status: newRow.status,
      date_added: newRow.date_added,
      last_edited_by: newRow.last_edited_by,
    }).then(({ error }) => {
      if (error) {
        setDbItems(prev => prev.filter(r => r.id !== id));
        showErrorToast('Failed to add item. Change reverted.');
        console.error('Add item error:', error);
      }
    });

    return newItem;
  }, [slugToModuleId, activeContent]);

  const addNewModule = useCallback((name: string): ContentItem => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const maxOrder = dbModules.length > 0
      ? Math.max(...dbModules.map(m => m.order))
      : -1;

    const newModuleId = crypto.randomUUID();
    const newModule: DbModule = {
      id: newModuleId,
      slug,
      title: name,
      order: maxOrder + 1,
      status: 'active',
    };

    // Optimistic add module
    setDbModules(prev => [...prev, newModule]);

    supabase.from('modules').insert({
      id: newModuleId,
      slug,
      title: name,
      order: maxOrder + 1,
      status: 'active',
    }).then(({ error }) => {
      if (error) {
        setDbModules(prev => prev.filter(m => m.id !== newModuleId));
        showErrorToast('Failed to add module. Change reverted.');
        console.error('Add module error:', error);
      }
    });

    // Create an initial item in the new module
    const itemId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newRow: DbContentItem = {
      id: itemId,
      module_id: newModuleId,
      type: 'fact',
      title: 'New Item',
      body: '',
      persona: [],
      tags: [],
      confidence: 'claim',
      source_label: null,
      source_url: null,
      order: 0,
      status: 'active',
      date_added: now.split('T')[0],
      last_edited_by: 'owner',
      updated_at: now,
      pre_archive_status: null,
    };

    setDbItems(prev => [...prev, newRow]);

    supabase.from('content_items').insert({
      id: newRow.id,
      module_id: newRow.module_id,
      type: newRow.type,
      title: newRow.title,
      body: newRow.body,
      persona: newRow.persona,
      tags: newRow.tags,
      confidence: newRow.confidence,
      source_label: newRow.source_label,
      source_url: newRow.source_url,
      order: newRow.order,
      status: newRow.status,
      date_added: newRow.date_added,
      last_edited_by: newRow.last_edited_by,
    }).then(({ error }) => {
      if (error) {
        setDbItems(prev => prev.filter(r => r.id !== itemId));
        showErrorToast('Failed to add initial item. Change reverted.');
        console.error('Add initial item error:', error);
      }
    });

    return dbItemToContentItem(newRow, slug);
  }, [dbModules]);

  const revert = useCallback((_id: string) => {
    // In the live backend model, "revert" refreshes from DB
    fetchData();
  }, [fetchData]);

  const discardAll = useCallback(() => {
    // Refresh from DB (no local draft to discard)
    setEditedIds(new Set());
    fetchData();
  }, [fetchData]);

  const reorderModuleList = useCallback((orderedSlugs: string[]) => {
    const prevModules = [...dbModules];

    setDbModules(prev => {
      const updated = [...prev];
      for (let i = 0; i < orderedSlugs.length; i++) {
        const idx = updated.findIndex(m => m.slug === orderedSlugs[i]);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], order: i };
        }
      }
      return updated.sort((a, b) => a.order - b.order);
    });

    const updates = orderedSlugs.map((slug, i) => {
      const mod = dbModules.find(m => m.slug === slug);
      if (!mod) return Promise.resolve({ error: null });
      return supabase.from('modules').update({ order: i }).eq('id', mod.id);
    });

    Promise.all(updates).then(results => {
      const failed = results.find(r => r.error);
      if (failed) {
        setDbModules(prevModules);
        showErrorToast('Reorder modules failed. Changes reverted.');
        fetchData();
      }
    });
  }, [dbModules, fetchData]);

  // ── Module CRUD ──

  const renameModule = useCallback((moduleId: string, newTitle: string) => {
    const prevModules = [...dbModules];
    const mod = dbModules.find(m => m.id === moduleId);
    if (!mod) return;

    const newSlug = newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Optimistic update
    setDbModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, title: newTitle, slug: newSlug } : m
    ));

    writeToSupabase(
      () => supabase.from('modules').update({ title: newTitle, slug: newSlug }).eq('id', moduleId),
      () => setDbModules(prevModules),
      'Rename module'
    );
  }, [dbModules, writeToSupabase]);

  const archiveModule = useCallback((moduleId: string) => {
    const prevModules = [...dbModules];
    const prevItems = [...dbItems];

    // Optimistic: archive module
    setDbModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, status: 'archived' } : m
    ));

    // Optimistic: cascade archive all module items, saving pre_archive_status
    setDbItems(prev => prev.map(r =>
      r.module_id === moduleId && r.status !== 'archived'
        ? { ...r, pre_archive_status: r.status, status: 'archived' }
        : r
    ));

    // DB: archive module
    supabase.from('modules').update({ status: 'archived' }).eq('id', moduleId)
      .then(({ error: modErr }) => {
        if (modErr) {
          setDbModules(prevModules);
          setDbItems(prevItems);
          showErrorToast('Archive module failed. Changes reverted.');
          fetchData();
          return;
        }

        // DB: cascade archive items — save pre_archive_status and set status='archived'
        const itemsToArchive = prevItems.filter(r => r.module_id === moduleId && r.status !== 'archived');
        if (itemsToArchive.length === 0) return;

        const updates = itemsToArchive.map(r =>
          supabase.from('content_items')
            .update({ status: 'archived', pre_archive_status: r.status })
            .eq('id', r.id)
        );

        Promise.all(updates).then(results => {
          const failed = results.find(r => r.error);
          if (failed) {
            setDbModules(prevModules);
            setDbItems(prevItems);
            showErrorToast('Archive module items failed. Changes reverted.');
            fetchData();
          }
        });
      });
  }, [dbModules, dbItems, fetchData]);

  const restoreModule = useCallback((moduleId: string) => {
    const prevModules = [...dbModules];
    const prevItems = [...dbItems];

    // Optimistic: restore module
    setDbModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, status: 'active' } : m
    ));

    // Optimistic: cascade restore items to their pre_archive_status
    setDbItems(prev => prev.map(r => {
      if (r.module_id !== moduleId || r.status !== 'archived') return r;
      const restoredStatus = r.pre_archive_status || 'active';
      return { ...r, status: restoredStatus, pre_archive_status: null };
    }));

    // DB: restore module
    supabase.from('modules').update({ status: 'active' }).eq('id', moduleId)
      .then(({ error: modErr }) => {
        if (modErr) {
          setDbModules(prevModules);
          setDbItems(prevItems);
          showErrorToast('Restore module failed. Changes reverted.');
          fetchData();
          return;
        }

        // DB: cascade restore items
        const itemsToRestore = prevItems.filter(r => r.module_id === moduleId && r.status === 'archived');
        if (itemsToRestore.length === 0) return;

        const updates = itemsToRestore.map(r => {
          const restoredStatus = r.pre_archive_status || 'active';
          return supabase.from('content_items')
            .update({ status: restoredStatus, pre_archive_status: null })
            .eq('id', r.id);
        });

        Promise.all(updates).then(results => {
          const failed = results.find(r => r.error);
          if (failed) {
            setDbModules(prevModules);
            setDbItems(prevItems);
            showErrorToast('Restore module items failed. Changes reverted.');
            fetchData();
          }
        });
      });
  }, [dbModules, dbItems, fetchData]);

  const purgeModule = useCallback((moduleId: string) => {
    const prevModules = [...dbModules];
    const prevItems = [...dbItems];

    // Optimistic: remove module and all its items
    setDbModules(prev => prev.filter(m => m.id !== moduleId));
    setDbItems(prev => prev.filter(r => r.module_id !== moduleId));

    // DB: delete items first (ON DELETE CASCADE should handle this, but be explicit)
    supabase.from('content_items').delete().eq('module_id', moduleId)
      .then(({ error: itemErr }) => {
        if (itemErr) {
          setDbModules(prevModules);
          setDbItems(prevItems);
          showErrorToast('Purge module items failed. Changes reverted.');
          fetchData();
          return;
        }

        supabase.from('modules').delete().eq('id', moduleId)
          .then(({ error: modErr }) => {
            if (modErr) {
              setDbModules(prevModules);
              setDbItems(prevItems);
              showErrorToast('Purge module failed. Changes reverted.');
              fetchData();
            }
          });
      });
  }, [dbModules, dbItems, fetchData]);

  const setInterviewAt = useCallback((dateStr: string) => {
    setInterviewAtState(dateStr);
    supabase
      .from('app_settings')
      .update({ value: dateStr })
      .eq('key', 'interview_at')
      .then(({ error }) => {
        if (error) {
          showErrorToast('Failed to save interview date.');
          console.error('Set interview_at error:', error);
        }
      });
  }, []);

  const hasChanges = editedIds.size > 0;
  const changeCount = editedIds.size;
  const isEdited = useCallback((id: string) => editedIds.has(id), [editedIds]);
  const refresh = useCallback(() => fetchData(), [fetchData]);

  const value = useMemo<SupabaseContentState>(() => ({
    loading,
    error,
    allContent,
    activeContent,
    archivedContent,
    modules,
    moduleObjects,
    allModuleObjects,
    archivedModules,
    getModuleItems,
    getContentByModule,
    getDrillableItems,
    getSourceItems,
    getContentByPersona,
    getModuleItemCount,
    isAuthoring,
    toggleAuthoring,
    isOwner,
    ownerKeyPromptOpen,
    submitOwnerKey,
    logout,
    saveItem,
    reorderItems,
    archive,
    restore,
    purge,
    addNewItem,
    addNewModule,
    revert,
    discardAll,
    hasChanges,
    changeCount,
    isEdited,
    reorderModuleList,
    refresh,
    renameModule,
    archiveModule,
    restoreModule,
    purgeModule,
    interviewAt,
    setInterviewAt,
  }), [
    loading, error, allContent, activeContent, archivedContent, modules,
    moduleObjects, allModuleObjects, archivedModules,
    getModuleItems, getContentByModule, getDrillableItems, getSourceItems,
    getContentByPersona, getModuleItemCount, isAuthoring, toggleAuthoring, isOwner,
    ownerKeyPromptOpen, submitOwnerKey, logout, saveItem, reorderItems,
    archive, restore, purge, addNewItem, addNewModule, revert, discardAll,
    hasChanges, changeCount, isEdited, reorderModuleList, refresh,
    renameModule, archiveModule, restoreModule, purgeModule,
    interviewAt, setInterviewAt,
  ]);

  return (
    <SupabaseContentContext.Provider value={value}>
      {children}
    </SupabaseContentContext.Provider>
  );
}

export function useSupabaseContent(): SupabaseContentState {
  const ctx = useContext(SupabaseContentContext);
  if (!ctx) throw new Error('useSupabaseContent must be used within SupabaseContentProvider');
  return ctx;
}
