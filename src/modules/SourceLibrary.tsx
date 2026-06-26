import { useState, useMemo } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { Badge } from '../components/Badge';
import { ModuleHeader } from '../components/ModuleHeader';

export function SourceLibrary() {
  const { getSourceItems } = useSupabaseContent();
  const sources = useMemo(() => getSourceItems(), [getSourceItems]);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'module'>('date');

  const modules = useMemo(() => {
    const mods = [...new Set(sources.map(s => s.module))];
    return mods.sort();
  }, [sources]);

  const filtered = useMemo(() => {
    let result = sources;
    if (filterModule !== 'all') result = result.filter(s => s.module === filterModule);
    if (filterConfidence !== 'all') result = result.filter(s => s.confidence === filterConfidence);
    if (sortBy === 'date') result = [...result].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    else result = [...result].sort((a, b) => a.module.localeCompare(b.module));
    return result;
  }, [sources, filterModule, filterConfidence, sortBy]);

  if (sources.length === 0) {
    return (
      <div>
        <ModuleHeader title="Source Library" subtitle="Your growing research vault" itemCount={0} />
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-16)',
          border: '2px dashed var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-tertiary)',
        }}>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No sources yet</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Add a <code>source</code> field to any content item and it will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader title="Source Library" subtitle="Your growing research vault" itemCount={sources.length} />

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-3)', 
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <option value="all">All modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          value={filterConfidence}
          onChange={(e) => setFilterConfidence(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <option value="all">All confidence</option>
          <option value="verified">Verified</option>
          <option value="inferred">Inferred</option>
          <option value="claim">Claim</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'module')}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <option value="date">Sort by date</option>
          <option value="module">Sort by module</option>
        </select>

        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
          {filtered.length} results
        </span>
      </div>

      {/* Source list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map(item => (
          <article
            key={item.id}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
              <ConfidenceBadge confidence={item.confidence} />
              <Badge label={item.module} variant="muted" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.dateAdded}</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>
              {item.title}
            </h3>
            {item.source && (
              <a 
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textDecoration: 'none' }}
              >
                {item.source.label} &#8599;
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
