import { useState } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Badge } from './Badge';

export function ArchiveDrawer() {
  const { archivedContent, restore, purge } = useSupabaseContent();
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);
  const [purgeText, setPurgeText] = useState('');

  if (archivedContent.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-8)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)',
      }}>
        No archived items
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-2)',
      }}>
        {archivedContent.length} archived item{archivedContent.length !== 1 ? 's' : ''}
      </div>
      {archivedContent.map(item => (
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
