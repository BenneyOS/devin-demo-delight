/**
 * BrandMark — "Inputs → Outcomes" convergence glyph.
 *
 * Scattered grey input lines converging through a focal point
 * into a single gold outcome dot. Original mark, no third-party logos.
 */

interface Props {
  size?: number;
}

export function BrandMark({ size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="From Inputs to Outcomes"
    >
      {/* Input lines converging to center-right focal point */}
      <line x1="4" y1="8" x2="28" y2="24" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="4" y1="16" x2="28" y2="24" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="4" y1="24" x2="28" y2="24" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="4" y1="32" x2="28" y2="24" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="4" y1="40" x2="28" y2="24" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Convergence line to outcome */}
      <line x1="28" y1="24" x2="40" y2="24" stroke="#d4a853" strokeWidth="2" strokeLinecap="round" />

      {/* Gold outcome dot */}
      <circle cx="42" cy="24" r="4" fill="#d4a853" />
      <circle cx="42" cy="24" r="2" fill="#f5c842" />
    </svg>
  );
}
