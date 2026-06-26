import { useState, useMemo } from 'react';
import type { ContentItem } from '../content/schema';
import { ModuleHeader } from '../components/ModuleHeader';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { DrillCard } from '../components/DrillCard';
import { Badge } from '../components/Badge';
import { EditableItem } from '../components/EditableItem';
import type { Rating } from '../engine/sm2';
import { calculateNextReview, getReviewState, saveReviewState, getDueItems } from '../engine/sm2';
import { useNotes } from '../hooks/useNotes';
import { useSupabaseContent } from '../hooks/useSupabaseContent';

interface Props {
  module: string;
  title: string;
  subtitle?: string;
  items: ContentItem[];
}

type ViewMode = 'study' | 'drill';

export function ModuleView({ module, title, subtitle, items }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('study');
  const [drillIndex, setDrillIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { addNote, getNotesForItem } = useNotes();
  const [noteInput, setNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const ctx = useSupabaseContent();
  const isAuthoring = ctx.isAuthoring;

  const authoredItems = useMemo(() => {
    if (isAuthoring) {
      return ctx.getModuleItems(module);
    }
    return items;
  }, [isAuthoring, ctx, module, items]);

  const displayItems = isAuthoring ? authoredItems : items;

  const drillableItems = useMemo(() => 
    displayItems.filter(i => i.type === 'question' || i.type === 'objection' || i.type === 'story-beat'),
    [displayItems]
  );

  const dueItemIds = useMemo(() => getDueItems(drillableItems.map(i => i.id)), [drillableItems]);
  const dueItems = useMemo(() => 
    drillableItems.filter(i => dueItemIds.includes(i.id)),
    [drillableItems, dueItemIds]
  );

  const handleRate = (rating: Rating) => {
    const currentItem = dueItems[drillIndex] || drillableItems[drillIndex];
    if (!currentItem) return;
    
    const state = getReviewState(currentItem.id);
    const newState = calculateNextReview(state, rating);
    saveReviewState(newState);
    
    if (drillIndex < (dueItems.length || drillableItems.length) - 1) {
      setDrillIndex(prev => prev + 1);
    } else {
      setDrillIndex(0);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddNote = (itemId: string) => {
    if (noteText.trim()) {
      addNote(itemId, noteText.trim());
      setNoteText('');
      setNoteInput(null);
    }
  };

  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      ctx.addNewItem(module, newItemTitle.trim());
      setNewItemTitle('');
      setAddingItem(false);
    }
  };

  const handleMoveItem = (currentIndex: number, direction: 'up' | 'down') => {
    const ids = authoredItems.map(i => i.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    const newIds = [...ids];
    [newIds[currentIndex], newIds[targetIndex]] = [newIds[targetIndex], newIds[currentIndex]];
    ctx.reorderItems(module, newIds);
  };

  const activeDrillItems = dueItems.length > 0 ? dueItems : drillableItems;

  return (
    <div>
      <ModuleHeader 
        title={title} 
        subtitle={subtitle} 
        itemCount={displayItems.length}
        dueCount={dueItems.length}
      />

      {/* View Mode Toggle */}
      {drillableItems.length > 0 && !isAuthoring && (
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-1)', 
          marginBottom: 'var(--space-6)',
          background: 'var(--bg-tertiary)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
        }}>
          {(['study', 'drill'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setDrillIndex(0); }}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                background: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                transition: 'var(--transition-fast)',
              }}
            >
              {mode === 'study' ? 'Study' : `Drill (${dueItems.length || drillableItems.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Authoring Mode: Editable Items */}
      {isAuthoring && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {authoredItems.map((item, index) => (
            <EditableItem
              key={item.id}
              item={item}
              index={index}
              totalItems={authoredItems.length}
              onMoveUp={() => handleMoveItem(index, 'up')}
              onMoveDown={() => handleMoveItem(index, 'down')}
            />
          ))}

          {/* Add item */}
          {addingItem ? (
            <div style={{
              display: 'flex',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-primary)',
              borderRadius: 'var(--radius-md)',
            }}>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                placeholder="Item title..."
                autoFocus
                style={{
                  flex: 1,
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              />
              <button
                onClick={handleAddItem}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
              <button
                onClick={() => { setAddingItem(false); setNewItemTitle(''); }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              style={{
                padding: 'var(--space-3)',
                background: 'transparent',
                color: 'var(--accent)',
                border: '1px dashed var(--accent)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              + Add item
            </button>
          )}
        </div>
      )}

      {/* Study View (non-authoring) */}
      {!isAuthoring && viewMode === 'study' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {displayItems.map(item => {
            const isExpanded = expandedItems.has(item.id);
            const notes = getNotesForItem(item.id);
            
            return (
              <article
                key={item.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-5)',
                  transition: 'var(--transition-fast)',
                }}
              >
                {/* Header */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggleExpand(item.id); }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <ConfidenceBadge confidence={item.confidence} />
                    <Badge label={item.type} />
                    {item.persona.map(p => (
                      <Badge key={p} label={p} variant="accent" />
                    ))}
                  </div>
                  <h3 style={{ 
                    fontSize: 'var(--text-base)', 
                    fontWeight: 500, 
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}>
                    <span style={{ 
                      display: 'inline-block',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                      transition: 'var(--transition-fast)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                    }}>
                      &#9654;
                    </span>
                    {item.title}
                  </h3>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-4)', paddingLeft: 'var(--space-6)' }}>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      marginBottom: 'var(--space-4)',
                    }}>
                      {item.body}
                    </div>

                    {/* Source */}
                    {item.source && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                        Source: <a 
                          href={item.source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          {item.source.label}
                        </a>
                      </div>
                    )}

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{ 
                          fontSize: 'var(--text-xs)', 
                          color: 'var(--text-tertiary)',
                          padding: '1px 6px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Notes */}
                    {notes.length > 0 && (
                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        {notes.map(note => (
                          <div key={note.id} style={{ 
                            fontSize: 'var(--text-sm)', 
                            color: 'var(--text-secondary)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--warning-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--warning)',
                            marginBottom: 'var(--space-1)',
                          }}>
                            {note.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note */}
                    {noteInput === item.id ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(item.id); }}
                          placeholder="Add a reflection note..."
                          autoFocus
                          style={{
                            flex: 1,
                            padding: 'var(--space-2) var(--space-3)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-sm)',
                          }}
                        />
                        <button
                          onClick={() => handleAddNote(item.id)}
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setNoteInput(null); setNoteText(''); }}
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'transparent',
                            color: 'var(--text-tertiary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNoteInput(item.id)}
                        style={{
                          padding: 'var(--space-1) var(--space-3)',
                          background: 'transparent',
                          color: 'var(--text-tertiary)',
                          border: 'none',
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        + Add reflection note
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Drill View */}
      {!isAuthoring && viewMode === 'drill' && (
        <div>
          {activeDrillItems.length > 0 ? (
            <>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}>
                Card {drillIndex + 1} of {activeDrillItems.length}
                {dueItems.length > 0 && ' (due today)'}
              </div>
              <DrillCard 
                key={activeDrillItems[drillIndex]?.id}
                item={activeDrillItems[drillIndex]} 
                onRate={handleRate} 
              />
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-12)',
              color: 'var(--text-tertiary)',
            }}>
              <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>All caught up</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>No items due for review in this module.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
