interface Props {
  label: string;
  variant?: 'default' | 'accent' | 'muted';
}

export function Badge({ label, variant = 'default' }: Props) {
  const colors = {
    default: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    accent: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
    muted: { bg: 'var(--bg-hover)', color: 'var(--text-tertiary)' },
  };

  const { bg, color } = colors[variant];

  return (
    <span style={{
      display: 'inline-block',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      background: bg,
      color,
    }}>
      {label}
    </span>
  );
}
