import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function Card({ children, variant = 'default', padding = 'md', onClick, className = '' }: Props) {
  const paddings = { sm: 'var(--space-3)', md: 'var(--space-5)', lg: 'var(--space-8)' };
  
  const baseStyle: React.CSSProperties = {
    padding: paddings[padding],
    borderRadius: 'var(--radius-md)',
    transition: 'var(--transition-fast)',
    cursor: onClick ? 'pointer' : undefined,
  };

  const variants: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-secondary)',
    },
    elevated: {
      background: 'var(--bg-primary)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-secondary)',
    },
    outlined: {
      background: 'transparent',
      border: '1px solid var(--border-primary)',
    },
  };

  return (
    <div
      className={className}
      style={{ ...baseStyle, ...variants[variant] }}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}
