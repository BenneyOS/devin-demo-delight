import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ContentItem } from '../content/schema';
import {
  getActiveContent,
  getArchivedContent,
  getEffectiveContentByModule,
  getEffectiveModules,
  saveDraftItem,
  reorderModuleItems,
  archiveItem,
  restoreItem,
  purgeItem,
  addItem,
  addModule,
  revertItem,
  discardAllDrafts,
  hasDraftChanges,
  countDraftChanges,
  isItemEdited,
  reorderModules,
} from '../engine/draft';
import type { ModuleName } from '../content/schema';

interface AuthoringState {
  isAuthoring: boolean;
  toggleAuthoring: () => void;
  activeContent: ContentItem[];
  archivedContent: ContentItem[];
  modules: string[];
  getModuleItems: (module: string) => ContentItem[];
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
}

export const AuthoringContext = createContext<AuthoringState | null>(null);

export function useAuthoringState() {
  const [isAuthoring, setIsAuthoring] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const toggleAuthoring = useCallback(() => setIsAuthoring(prev => !prev), []);

  const activeContent = useMemo(() => getActiveContent(), [version]);
  const archivedContent = useMemo(() => getArchivedContent(), [version]);
  const modules = useMemo(() => getEffectiveModules(), [version]);

  const getModuleItems = useCallback((module: string) =>
    getEffectiveContentByModule(module), [version]);

  const saveItem = useCallback((item: ContentItem) => {
    saveDraftItem(item);
    refresh();
  }, [refresh]);

  const reorderItems = useCallback((module: string, ids: string[]) => {
    reorderModuleItems(module, ids);
    refresh();
  }, [refresh]);

  const archive = useCallback((id: string) => {
    archiveItem(id);
    refresh();
  }, [refresh]);

  const restore = useCallback((id: string) => {
    restoreItem(id);
    refresh();
  }, [refresh]);

  const purge = useCallback((id: string) => {
    purgeItem(id);
    refresh();
  }, [refresh]);

  const addNewItem = useCallback((module: string, title: string) => {
    const item = addItem(module as ModuleName, title);
    refresh();
    return item;
  }, [refresh]);

  const addNewModule = useCallback((name: string) => {
    const item = addModule(name);
    refresh();
    return item;
  }, [refresh]);

  const revert = useCallback((id: string) => {
    revertItem(id);
    refresh();
  }, [refresh]);

  const discardAll = useCallback(() => {
    discardAllDrafts();
    refresh();
  }, [refresh]);

  const hasChanges = useMemo(() => hasDraftChanges(), [version]);
  const changeCount = useMemo(() => countDraftChanges(), [version]);

  const isEdited = useCallback((id: string) => isItemEdited(id), [version]);

  const reorderModuleList = useCallback((mods: string[]) => {
    reorderModules(mods);
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    isAuthoring,
    toggleAuthoring,
    activeContent,
    archivedContent,
    modules,
    getModuleItems,
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
  }), [isAuthoring, toggleAuthoring, activeContent, archivedContent, modules,
    getModuleItems, saveItem, reorderItems, archive, restore, purge,
    addNewItem, addNewModule, revert, discardAll, hasChanges, changeCount,
    isEdited, reorderModuleList, refresh]);
}

export function useAuthoring(): AuthoringState {
  const ctx = useContext(AuthoringContext);
  if (!ctx) throw new Error('useAuthoring must be used within AuthoringContext.Provider');
  return ctx;
}
