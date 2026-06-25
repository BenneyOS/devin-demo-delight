interface Props {
  title: string;
  subtitle?: string;
  itemCount: number;
  dueCount?: number;
}

export function ModuleHeader({ title, subtitle, itemCount, dueCount }: Props) {
  return (
    <header style={{ marginBottom: 'var(--space-8)' }}>
      <h1 style={{ 
        fontSize: 'var(--text-2xl)', 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: 'var(--text-lg)', 
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          marginBottom: 'var(--space-3)',
        }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
        <span>{itemCount} items</span>
        {dueCount !== undefined && dueCount > 0 && (
          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
            {dueCount} due for review
          </span>
        )}
      </div>
    </header>
  );
}
