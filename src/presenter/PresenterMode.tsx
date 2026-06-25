import { useState, useMemo } from 'react';
import { allContent } from '../content';
import type { ContentItem, Persona } from '../content';
import { useNotes } from '../hooks/useNotes';

interface Props {
  onExit: () => void;
}

export function PresenterMode({ onExit }: Props) {
  const [personaFilter, setPersonaFilter] = useState<Persona | 'all'>('all');
  const [activeSection, setActiveSection] = useState<'discovery' | 'demo' | 'objections' | 'notes'>('discovery');
  const { getPinnedNotes } = useNotes();

  const filteredContent = useMemo(() => {
    if (personaFilter === 'all') return allContent;
    return allContent.filter(item => item.persona.includes(personaFilter));
  }, [personaFilter]);

  const discoveryQuestions = useMemo(() => 
    filteredContent.filter(i => i.module === 'discovery' && i.type === 'question'),
    [filteredContent]
  );

  const demoBeats = useMemo(() => 
    filteredContent.filter(i => i.module === 'devin-narrative' && i.type === 'story-beat'),
    [filteredContent]
  );

  const objections = useMemo(() => 
    filteredContent.filter(i => i.type === 'objection'),
    [filteredContent]
  );

  const pinnedNotes = useMemo(() => getPinnedNotes(), [getPinnedNotes]);

  const personas: (Persona | 'all')[] = ['all', 'CTO', 'CIO', 'Security'];
  const sections = [
    { key: 'discovery' as const, label: 'Discovery' },
    { key: 'demo' as const, label: 'Demo' },
    { key: 'objections' as const, label: 'Objections' },
    { key: 'notes' as const, label: 'Notes' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      zIndex: 9999,
      overflow: 'auto',
      padding: 'var(--space-4)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {personas.map(p => (
            <button
              key={p}
              onClick={() => setPersonaFilter(p)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
                background: personaFilter === p ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: personaFilter === p ? '#fff' : 'var(--text-secondary)',
                transition: 'var(--transition-fast)',
              }}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <button
          onClick={onExit}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          Exit Presenter
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-1)', 
        marginBottom: 'var(--space-6)',
        borderBottom: '1px solid var(--border-secondary)',
        paddingBottom: 'var(--space-2)',
      }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: 'none',
              borderBottom: activeSection === s.key ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: activeSection === s.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-lg)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {activeSection === 'discovery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {discoveryQuestions.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 'var(--text-lg)' }}>
                No discovery questions for this persona filter.
              </p>
            ) : (
              discoveryQuestions.map(item => (
                <PresenterCard key={item.id} item={item} />
              ))
            )}
          </div>
        )}

        {activeSection === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {demoBeats.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 'var(--text-lg)' }}>
                No demo beats for this persona filter.
              </p>
            ) : (
              demoBeats.map(item => (
                <PresenterCard key={item.id} item={item} />
              ))
            )}
          </div>
        )}

        {activeSection === 'objections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {objections.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 'var(--text-lg)' }}>
                No objections for this persona filter.
              </p>
            ) : (
              objections.map(item => (
                <PresenterCard key={item.id} item={item} />
              ))
            )}
          </div>
        )}

        {activeSection === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pinnedNotes.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontSize: 'var(--text-lg)' }}>
                No pinned notes. Pin reflection notes from Study mode to see them here.
              </p>
            ) : (
              pinnedNotes.map(note => (
                <div key={note.id} style={{
                  padding: 'var(--space-4)',
                  background: 'var(--warning-subtle)',
                  borderLeft: '4px solid var(--warning)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-lg)',
                  lineHeight: 1.6,
                }}>
                  {note.text}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PresenterCard({ item }: { item: ContentItem }) {
  return (
    <div style={{
      padding: 'var(--space-5)',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      borderLeft: '4px solid var(--accent)',
    }}>
      <div style={{ 
        fontSize: 'var(--text-xs)', 
        color: 'var(--text-tertiary)', 
        marginBottom: 'var(--space-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {item.persona.join(' / ') || 'All'}
      </div>
      <h3 style={{ 
        fontSize: 'var(--text-lg)', 
        fontWeight: 600, 
        marginBottom: 'var(--space-3)',
        color: 'var(--text-primary)',
      }}>
        {item.title}
      </h3>
      <div style={{ 
        fontSize: 'var(--text-base)', 
        lineHeight: 1.8, 
        color: 'var(--text-secondary)',
        whiteSpace: 'pre-wrap',
      }}>
        {item.body}
      </div>
    </div>
  );
}
