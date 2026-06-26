import { useState } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';

export function BackupExport() {
  const { allContent } = useSupabaseContent();
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(allContent, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trusted-advisor-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div style={{
      padding: 'var(--space-6)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-secondary)',
      borderRadius: 'var(--radius-md)',
    }}>
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        Backup Export
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        Download a JSON snapshot of all content. This is a safety backup only — the live database is the source of truth.
      </p>
      <button
        onClick={handleExport}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          background: exported ? 'var(--success)' : 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {exported ? 'Downloaded!' : `Export Backup (${allContent.length} items)`}
      </button>
    </div>
  );
}
