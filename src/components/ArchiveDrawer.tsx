import { useState, useMemo } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Badge } from './Badge';

export function ArchiveDrawer() {
  const { archivedContent, archivedModules, restore, purge, restoreModule, purgeModule, allContent } = useSupabaseContent();
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);
  const [purgeText, setPurgeText] = useState('');
  const [confirmModulePurge, setConfirmModulePurge] = useState<string | null>(null);
  const [modulePurgeText, setModulePurgeText] = useState('');

  const orphanArchivedItems = useMemo(() => {
    const archivedModuleIds = new Set(archivedModules.map(m => m.id));
    return archivedContent.filter(item => {
      const moduleObj = allContent.find(c => c.id === item.id);
      if (!moduleObj) return true;
      return !archivedModuleIds.has(
        archivedModules.find(m => m.slug === item.module)?.id || ''
      );
    });
  }, [archivedContent, archivedModules, allContent]);

  const moduleArchivedItems = useMemo(() => {
    const map = new Map<string, typeof archivedContent>();
    for (const mod of archivedModules) {
      map.set(mod.slug, archivedContent.filter(item => item.module === mod.slug));
    }
    return map;
  }, [archivedContent, archivedModules]);

  if (archivedContent.length === 0 && archivedModules.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-8)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
      }}>
        No archived items or categories
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Archived Modules Section */}
      {archivedModules.length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            Archived Categories
          </div>
          {archivedModules.map(mod => {
            const modItems = moduleArchivedItems.get(mod.slug) || [];
            return (
              <div
                key={mod.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-2)',
                  opacity: 0.8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <Badge label="category" variant="default" />
                  <Badge label="archived" variant="default" />
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                  {mod.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                  {modItems.length} item{modItems.length !== 1 ? 's' : ''} will be restored with this category
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => restoreModule(mod.id)}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      fontSize: 'var(--text-xs)',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  >
                    Restore Category
                  </button>
                  {confirmModulePurge === mod.id ? (
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={modulePurgeText}
                        onChange={(e) => setModulePurgeText(e.target.value)}
                        placeholder='Type "DELETE"'
                        style={{
                          padding: '2px var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          border: '1px solid #ef4444',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          width: 100,
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (modulePurgeText === 'DELETE') {
                            purgeModule(mod.id);
                            setConfirmModulePurge(null);
                            setModulePurgeText('');
                          }
                        }}
                        disabled={modulePurgeText !== 'DELETE'}
                        style={{
                          padding: '2px var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          background: modulePurgeText === 'DELETE' ? '#ef4444' : 'var(--bg-tertiary)',
                          color: modulePurgeText === 'DELETE' ? '#fff' : 'var(--text-tertiary)',
                          cursor: modulePurgeText === 'DELETE' ? 'pointer' : 'default',
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setConfirmModulePurge(null); setModulePurgeText(''); }}
                        style={{
                          padding: '2px var(--space-2)',
                          fontSize: 'var(--text-xs)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          background: 'transparent',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmModulePurge(mod.id)}
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        fontSize: 'var(--text-xs)',
                        border: '1px solid #ef4444',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      Purge Category
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Items Section */}
      {orphanArchivedItems.length > 0 && (
        <div style={{
          fontSize: 'var(--text-sm)',
          fontWeight: archivedModules.length > 0 ? 600 : 400,
          color: archivedModules.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
          marginBottom: 'var(--space-2)',
        }}>
          {archivedModules.length > 0 ? 'Archived Items' : ''} {orphanArchivedItems.length} archived item{orphanArchivedItems.length !== 1 ? 's' : ''}
        </div>
      )}
      {orphanArchivedItems.map(item => (
        <div
          key={item.id}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            opacity: 0.7,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
            <ConfidenceBadge confidence={item.confidence} />
            <Badge label={item.type} />
            <Badge label="archived" variant="default" />
          </div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            {item.title}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => restore(item.id)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 'var(--text-xs)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--accent)',
                cursor: 'pointer',
              }}
            >
              Restore
            </button>
            {confirmPurge === item.id ? (
              <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                <input
                  type="text"
                  value={purgeText}
                  onChange={(e) => setPurgeText(e.target.value)}
                  placeholder='Type "DELETE"'
                  style={{
                    padding: '2px var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    width: 100,
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (purgeText === 'DELETE') {
                      purge(item.id);
                      setConfirmPurge(null);
                      setPurgeText('');
                    }
                  }}
                  disabled={purgeText !== 'DELETE'}
                  style={{
                    padding: '2px var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: purgeText === 'DELETE' ? '#ef4444' : 'var(--bg-tertiary)',
                    color: purgeText === 'DELETE' ? '#fff' : 'var(--text-tertiary)',
                    cursor: purgeText === 'DELETE' ? 'pointer' : 'default',
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setConfirmPurge(null); setPurgeText(''); }}
                  style={{
                    padding: '2px var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmPurge(item.id)}
                style={{
                  padding: 'var(--space-1) var(--space-3)',
                  fontSize: 'var(--text-xs)',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
              >
                Purge
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
