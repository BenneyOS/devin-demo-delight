import { useAuthoring } from '../hooks/useAuthoring';
import { getDraftDifferences } from '../engine/draft';

export function PublishBanner() {
  const { hasChanges, changeCount, discardAll } = useAuthoring();

  if (!hasChanges) return null;

  const diff = getDraftDifferences();
  const parts: string[] = [];
  if (diff.editedIds.length) parts.push(`${diff.editedIds.length} edited`);
  if (diff.addedIds.length) parts.push(`${diff.addedIds.length} added`);
  if (diff.archivedIds.length) parts.push(`${diff.archivedIds.length} archived`);
  if (diff.purgedIds.length) parts.push(`${diff.purgedIds.length} purged`);

  return (
    <div style={{
      background: 'var(--warning-subtle)',
      border: '1px solid var(--warning)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3) var(--space-4)',
      marginBottom: 'var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
    }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
        <strong>{changeCount} unpublished change{changeCount !== 1 ? 's' : ''}</strong>
        <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>
          ({parts.join(', ')})
        </span>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Export to save changes permanently
        </div>
      </div>
      <button
        onClick={() => {
          if (window.confirm('Discard all unpublished changes? This cannot be undone.')) {
            discardAll();
          }
        }}
        style={{
          padding: 'var(--space-1) var(--space-3)',
          fontSize: 'var(--text-xs)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
        }}
      >
        Discard all
      </button>
    </div>
  );
}
