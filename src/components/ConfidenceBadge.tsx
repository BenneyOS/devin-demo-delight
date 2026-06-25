import type { Confidence } from '../content/schema';

interface Props {
  confidence: Confidence;
  size?: 'sm' | 'md';
}

const styles: Record<Confidence, { bg: string; color: string; label: string }> = {
  verified: { bg: 'var(--success-subtle)', color: 'var(--success)', label: 'Verified' },
  inferred: { bg: 'var(--warning-subtle)', color: 'var(--warning)', label: 'Inferred' },
  claim: { bg: 'var(--neutral-subtle)', color: 'var(--neutral)', label: 'Claim' },
};

export function ConfidenceBadge({ confidence, size = 'sm' }: Props) {
  const s = styles[confidence];
  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize,
        fontWeight: 500,
        padding,
        borderRadius: 'var(--radius-sm)',
        background: s.bg,
        color: s.color,
        lineHeight: 1.4,
      }}
      aria-label={`Confidence: ${s.label}`}
    >
      <span style={{ 
        width: size === 'sm' ? 6 : 8, 
        height: size === 'sm' ? 6 : 8, 
        borderRadius: '50%', 
        background: s.color 
      }} />
      {s.label}
    </span>
  );
}
