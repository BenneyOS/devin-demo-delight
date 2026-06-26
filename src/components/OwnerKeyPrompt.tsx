import { useState } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';

export function OwnerKeyPrompt() {
  const { ownerKeyPromptOpen, submitOwnerKey } = useSupabaseContent();
  const [key, setKey] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (!ownerKeyPromptOpen) return null;

  const handleSubmit = async () => {
    if (!key.trim()) return;
    setChecking(true);
    setError('');
    const ok = await submitOwnerKey(key.trim());
    setChecking(false);
    if (!ok) {
      setError('Invalid edit key. Please try again.');
      setKey('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Enter Edit Key
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Enter your owner edit key to enable editing. This key is stored locally in your browser.
        </p>
        {error && (
          <p style={{ fontSize: 'var(--text-sm)', color: '#ef4444', marginBottom: 'var(--space-3)' }}>
            {error}
          </p>
        )}
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Owner edit key..."
          autoFocus
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={handleSubmit}
            disabled={checking || !key.trim()}
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: checking ? 'wait' : 'pointer',
              opacity: checking || !key.trim() ? 0.6 : 1,
            }}
          >
            {checking ? 'Checking...' : 'Unlock Editing'}
          </button>
        </div>
      </div>
    </div>
  );
}
