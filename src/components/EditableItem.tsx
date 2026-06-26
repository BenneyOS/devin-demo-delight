import { useState } from 'react';
import type { ContentItem, ContentType, Confidence, Persona } from '../content/schema';
import { useAuthoring } from '../hooks/useAuthoring';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Badge } from './Badge';

interface Props {
  item: ContentItem;
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const CONTENT_TYPES: ContentType[] = ['fact', 'question', 'objection', 'card', 'source', 'story-beat'];
const CONFIDENCE_LEVELS: Confidence[] = ['verified', 'inferred', 'claim'];
const PERSONAS: Persona[] = ['CTO', 'CIO', 'Security'];

export function EditableItem({ item, index, totalItems, onMoveUp, onMoveDown }: Props) {
  const { saveItem, archive, revert, isEdited } = useAuthoring();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [type, setType] = useState(item.type);
  const [confidence, setConfidence] = useState(item.confidence);
  const [persona, setPersona] = useState<Persona[]>(item.persona);
  const [tags, setTags] = useState(item.tags.join(', '));
  const [sourceLabel, setSourceLabel] = useState(item.source?.label || '');
  const [sourceUrl, setSourceUrl] = useState(item.source?.url || '');

  const edited = isEdited(item.id);

  const handleSave = () => {
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const source = sourceLabel && sourceUrl
      ? { label: sourceLabel, url: sourceUrl }
      : null;

    saveItem({
      ...item,
      title,
      body,
      type,
      confidence,
      persona,
      tags: parsedTags,
      source,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(item.title);
    setBody(item.body);
    setType(item.type);
    setConfidence(item.confidence);
    setPersona(item.persona);
    setTags(item.tags.join(', '));
    setSourceLabel(item.source?.label || '');
    setSourceUrl(item.source?.url || '');
    setEditing(false);
  };

  const togglePersona = (p: Persona) => {
    setPersona(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const inputStyle = {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'inherit',
  };

  const smallBtnStyle = {
    padding: '2px var(--space-2)',
    fontSize: 'var(--text-xs)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    cursor: 'pointer',
    lineHeight: '1.4',
  };

  return (
    <article
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${edited ? 'var(--warning)' : 'var(--border-secondary)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
      }}
    >
      {/* Authoring controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move up"
          style={{ ...smallBtnStyle, color: index === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
        >
          &#9650;
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalItems - 1}
          aria-label="Move down"
          style={{ ...smallBtnStyle, color: index === totalItems - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
        >
          &#9660;
        </button>
        <button
          onClick={() => setEditing(!editing)}
          style={{ ...smallBtnStyle, color: 'var(--accent)' }}
        >
          {editing ? 'Cancel edit' : 'Edit'}
        </button>
        <button
          onClick={() => archive(item.id)}
          style={{ ...smallBtnStyle, color: 'var(--warning)' }}
        >
          Archive
        </button>
        {edited && (
          <button
            onClick={() => revert(item.id)}
            style={{ ...smallBtnStyle, color: 'var(--text-tertiary)' }}
          >
            Revert
          </button>
        )}
        {edited && (
          <Badge label="edited" variant="default" />
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          #{index + 1}
        </span>
      </div>

      {editing ? (
        /* Edit form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ContentType)} style={inputStyle}>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Confidence</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value as Confidence)} style={inputStyle}>
                {CONFIDENCE_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Persona</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {PERSONAS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePersona(p)}
                  style={{
                    padding: '2px var(--space-3)',
                    fontSize: 'var(--text-xs)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-sm)',
                    background: persona.includes(p) ? 'var(--accent-subtle)' : 'transparent',
                    color: persona.includes(p) ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontWeight: persona.includes(p) ? 500 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Source label</label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. Cognition Blog"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', display: 'block' }}>Source URL</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={handleSave}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: 'var(--space-2) var(--space-4)',
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
        </div>
      ) : (
        /* Read-only display */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
            <ConfidenceBadge confidence={item.confidence} />
            <Badge label={item.type} />
            {item.persona.map(p => (
              <Badge key={p} label={p} variant="accent" />
            ))}
          </div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            {item.title}
          </h3>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {item.body.length > 120 ? item.body.slice(0, 120) + '...' : item.body}
          </div>
          {item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
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
          )}
        </div>
      )}
    </article>
  );
}
