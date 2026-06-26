import { useState, useRef, useCallback } from 'react';
import type { ModuleObject } from '../hooks/useSupabaseContent';

interface CategoryNavItemProps {
  mod: ModuleObject;
  isActive: boolean;
  isAuthoring: boolean;
  onNavigate: (slug: string) => void;
  onRename: (moduleId: string, newTitle: string) => void;
  onArchive: (moduleId: string) => void;
  onDragStart: (moduleId: string) => void;
  onDragOver: (moduleId: string) => void;
  onDragEnd: () => void;
  onMoveUp: (moduleId: string) => void;
  onMoveDown: (moduleId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isDragTarget: boolean;
  itemCount: number;
}

function CategoryNavItem({
  mod,
  isActive,
  isAuthoring,
  onNavigate,
  onRename,
  onArchive,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isDragTarget,
  itemCount,
}: CategoryNavItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(mod.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== mod.title) {
      onRename(mod.id, trimmed);
    } else {
      setEditValue(mod.title);
    }
    setIsEditing(false);
  }, [editValue, mod.title, mod.id, onRename]);

  const startEditing = useCallback(() => {
    if (!isAuthoring) return;
    setEditValue(mod.title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [isAuthoring, mod.title]);

  const handleArchiveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = itemCount > 0
      ? `Archive "${mod.title}" and its ${itemCount} item${itemCount !== 1 ? 's' : ''}?`
      : `Archive "${mod.title}"?`;
    if (window.confirm(confirmMsg)) {
      onArchive(mod.id);
    }
  }, [mod.id, mod.title, itemCount, onArchive]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim();
      if (trimmed && trimmed !== mod.title) {
        onRename(mod.id, trimmed);
      }
    }, 300);
  }, [mod.id, mod.title, onRename]);

  if (isEditing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px var(--space-3)',
      }}>
        <input
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setEditValue(mod.title);
              setIsEditing(false);
            }
          }}
          style={{
            flex: 1,
            padding: 'var(--space-1) var(--space-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            outline: 'none',
            minWidth: 0,
          }}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      draggable={isAuthoring}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(mod.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(mod.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd();
      }}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        borderTop: isDragTarget ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'border-color 0.15s',
      }}
    >
      {isAuthoring && (
        <span
          style={{
            cursor: 'grab',
            color: 'var(--text-tertiary)',
            fontSize: '12px',
            padding: '0 2px',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title="Drag to reorder"
        >
          ⠿
        </span>
      )}
      <button
        onClick={() => onNavigate(mod.slug)}
        onDoubleClick={startEditing}
        style={{
          display: 'block',
          flex: 1,
          textAlign: 'left',
          padding: 'var(--space-2) var(--space-2)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: isActive ? 'var(--accent-subtle)' : 'transparent',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: isActive ? 500 : 400,
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {mod.title}
      </button>
      {isAuthoring && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(mod.id); }}
            disabled={isFirst}
            title="Move up"
            style={{
              border: 'none',
              background: 'transparent',
              color: isFirst ? 'var(--border-secondary)' : 'var(--text-tertiary)',
              cursor: isFirst ? 'default' : 'pointer',
              fontSize: '10px',
              lineHeight: 1,
              padding: '1px 4px',
            }}
          >
            ▲
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(mod.id); }}
            disabled={isLast}
            title="Move down"
            style={{
              border: 'none',
              background: 'transparent',
              color: isLast ? 'var(--border-secondary)' : 'var(--text-tertiary)',
              cursor: isLast ? 'default' : 'pointer',
              fontSize: '10px',
              lineHeight: 1,
              padding: '1px 4px',
            }}
          >
            ▼
          </button>
        </div>
      )}
      {isAuthoring && (
        <button
          onClick={startEditing}
          title="Rename"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 4px',
            flexShrink: 0,
          }}
        >
          ✎
        </button>
      )}
      {isAuthoring && (
        <button
          onClick={handleArchiveClick}
          title="Archive category"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 4px',
            flexShrink: 0,
          }}
        >
          ⊘
        </button>
      )}
    </div>
  );
}

interface CategoryNavProps {
  moduleObjects: ModuleObject[];
  currentPage: string;
  isAuthoring: boolean;
  onNavigate: (slug: string) => void;
  onRename: (moduleId: string, newTitle: string) => void;
  onArchive: (moduleId: string) => void;
  onAddCategory: () => void;
  onReorder: (orderedSlugs: string[]) => void;
  getModuleItemCount: (moduleId: string) => number;
}

export function CategoryNav({
  moduleObjects,
  currentPage,
  isAuthoring,
  onNavigate,
  onRename,
  onArchive,
  onAddCategory,
  onReorder,
  getModuleItemCount,
}: CategoryNavProps) {
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  const handleDragStart = useCallback((moduleId: string) => {
    setDragSourceId(moduleId);
  }, []);

  const handleDragOver = useCallback((moduleId: string) => {
    setDragTargetId(moduleId);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragSourceId && dragTargetId && dragSourceId !== dragTargetId) {
      const slugs = moduleObjects.map(m => m.slug);
      const srcIdx = moduleObjects.findIndex(m => m.id === dragSourceId);
      const tgtIdx = moduleObjects.findIndex(m => m.id === dragTargetId);
      if (srcIdx >= 0 && tgtIdx >= 0) {
        const newSlugs = [...slugs];
        const [moved] = newSlugs.splice(srcIdx, 1);
        newSlugs.splice(tgtIdx, 0, moved);
        onReorder(newSlugs);
      }
    }
    setDragSourceId(null);
    setDragTargetId(null);
  }, [dragSourceId, dragTargetId, moduleObjects, onReorder]);

  const handleMoveUp = useCallback((moduleId: string) => {
    const idx = moduleObjects.findIndex(m => m.id === moduleId);
    if (idx <= 0) return;
    const slugs = moduleObjects.map(m => m.slug);
    [slugs[idx - 1], slugs[idx]] = [slugs[idx], slugs[idx - 1]];
    onReorder(slugs);
  }, [moduleObjects, onReorder]);

  const handleMoveDown = useCallback((moduleId: string) => {
    const idx = moduleObjects.findIndex(m => m.id === moduleId);
    if (idx < 0 || idx >= moduleObjects.length - 1) return;
    const slugs = moduleObjects.map(m => m.slug);
    [slugs[idx], slugs[idx + 1]] = [slugs[idx + 1], slugs[idx]];
    onReorder(slugs);
  }, [moduleObjects, onReorder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {/* Dashboard (always first, not draggable) */}
      <button
        onClick={() => onNavigate('dashboard')}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: 'var(--space-2) var(--space-3)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: currentPage === 'dashboard' ? 'var(--accent-subtle)' : 'transparent',
          color: currentPage === 'dashboard' ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: currentPage === 'dashboard' ? 500 : 400,
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => { if (currentPage !== 'dashboard') e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { if (currentPage !== 'dashboard') e.currentTarget.style.background = 'transparent'; }}
      >
        Dashboard
      </button>

      {/* Module categories (draggable when authoring) */}
      {moduleObjects.map((mod, idx) => (
        <CategoryNavItem
          key={mod.id}
          mod={mod}
          isActive={currentPage === mod.slug}
          isAuthoring={isAuthoring}
          onNavigate={onNavigate}
          onRename={onRename}
          onArchive={onArchive}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          isFirst={idx === 0}
          isLast={idx === moduleObjects.length - 1}
          isDragTarget={dragTargetId === mod.id && dragSourceId !== mod.id}
          itemCount={getModuleItemCount(mod.id)}
        />
      ))}

      {/* Source Library (always last, not draggable) */}
      <button
        onClick={() => onNavigate('sources')}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: 'var(--space-2) var(--space-3)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: currentPage === 'sources' ? 'var(--accent-subtle)' : 'transparent',
          color: currentPage === 'sources' ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: currentPage === 'sources' ? 500 : 400,
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => { if (currentPage !== 'sources') e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { if (currentPage !== 'sources') e.currentTarget.style.background = 'transparent'; }}
      >
        Source Library
      </button>

      {/* Add category button (authoring only) */}
      {isAuthoring && (
        <button
          onClick={onAddCategory}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: 'var(--space-2) var(--space-3)',
            border: '1px dashed var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            marginTop: '4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          + Add category
        </button>
      )}
    </div>
  );
}
