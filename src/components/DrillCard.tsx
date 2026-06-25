import { useState } from 'react';
import type { ContentItem } from '../content/schema';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { Rating } from '../engine/sm2';

interface Props {
  item: ContentItem;
  onRate: (rating: Rating) => void;
  showAnswer?: boolean;
}

export function DrillCard({ item, onRate, showAnswer: forceShow }: Props) {
  const [revealed, setRevealed] = useState(forceShow ?? false);

  const handleReveal = () => setRevealed(true);

  const ratingButtons: { rating: Rating; label: string; color: string }[] = [
    { rating: 'again', label: 'Again', color: '#ef4444' },
    { rating: 'hard', label: 'Hard', color: 'var(--warning)' },
    { rating: 'good', label: 'Good', color: 'var(--success)' },
    { rating: 'easy', label: 'Easy', color: 'var(--accent)' },
  ];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-8)',
      maxWidth: '640px',
      margin: '0 auto',
    }}>
      {/* Question */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <ConfidenceBadge confidence={item.confidence} />
          {item.persona.length > 0 && (
            <span style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--text-tertiary)',
              padding: '2px 6px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
            }}>
              {item.persona.join(', ')}
            </span>
          )}
        </div>
        <h3 style={{ 
          fontSize: 'var(--text-lg)', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {item.title}
        </h3>
      </div>

      {/* Answer area */}
      {!revealed ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            Try to recall the answer before revealing
          </p>
          <button
            onClick={handleReveal}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Reveal Answer
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}>
            {item.body}
          </div>

          {/* Rating buttons */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-2)', 
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {ratingButtons.map(({ rating, label, color }) => (
              <button
                key={rating}
                onClick={() => {
                  onRate(rating);
                  setRevealed(false);
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color,
                  border: `1px solid ${color}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  minWidth: '70px',
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.background = color;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = color;
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
