import { useState, useRef, useCallback } from 'react';
import { useInterviewers } from '../hooks/useInterviewers';
import type { Interviewer } from '../hooks/useInterviewers';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { Card } from '../components/Card';

interface EditableFieldProps {
  label: string;
  value: string;
  isAuthoring: boolean;
  onSave: (val: string) => void;
  multiline?: boolean;
}

function EditableField({ label, value, isAuthoring, onSave, multiline }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  }, [draft, value, onSave]);

  if (editing && isAuthoring) {
    const inputStyle = {
      width: '100%',
      padding: 'var(--space-1) var(--space-2)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'inherit',
      resize: 'vertical' as const,
    };

    return (
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        {multiline ? (
          <textarea
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                if (e.target.value.trim() !== value) onSave(e.target.value.trim());
              }, 300);
            }}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            rows={3}
            autoFocus
            style={inputStyle}
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                if (e.target.value.trim() !== value) onSave(e.target.value.trim());
              }, 300);
            }}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            autoFocus
            style={inputStyle}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{ marginBottom: 'var(--space-3)', cursor: isAuthoring ? 'text' : 'default' }}
      onClick={() => { if (isAuthoring) { setDraft(value); setEditing(true); } }}
    >
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {value || (isAuthoring ? <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Click to edit...</span> : '—')}
      </div>
    </div>
  );
}

function InterviewerCard({
  interviewer, index, total, isAuthoring,
  onUpdate, onDelete, onReorder,
}: {
  interviewer: Interviewer;
  index: number;
  total: number;
  isAuthoring: boolean;
  onUpdate: (id: string, fields: Partial<Interviewer>) => void;
  onDelete: (id: string) => void;
  onReorder: (idx: number, dir: 'up' | 'down') => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(interviewer.name);
  const [editingRole, setEditingRole] = useState(false);
  const [roleVal, setRoleVal] = useState(interviewer.role);

  return (
    <Card variant="elevated" padding="md">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          {editingName && isAuthoring ? (
            <input
              type="text"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={() => { if (nameVal.trim() !== interviewer.name) onUpdate(interviewer.id, { name: nameVal.trim() }); setEditingName(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { if (nameVal.trim() !== interviewer.name) onUpdate(interviewer.id, { name: nameVal.trim() }); setEditingName(false); } if (e.key === 'Escape') { setNameVal(interviewer.name); setEditingName(false); } }}
              autoFocus
              style={{
                fontSize: 'var(--text-lg)', fontWeight: 600, border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)', padding: 'var(--space-1) var(--space-2)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%',
              }}
            />
          ) : (
            <h3
              style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', cursor: isAuthoring ? 'text' : 'default' }}
              onClick={() => { if (isAuthoring) { setNameVal(interviewer.name); setEditingName(true); } }}
            >
              {interviewer.name}
            </h3>
          )}
          {editingRole && isAuthoring ? (
            <input
              type="text"
              value={roleVal}
              onChange={e => setRoleVal(e.target.value)}
              onBlur={() => { if (roleVal.trim() !== interviewer.role) onUpdate(interviewer.id, { role: roleVal.trim() }); setEditingRole(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { if (roleVal.trim() !== interviewer.role) onUpdate(interviewer.id, { role: roleVal.trim() }); setEditingRole(false); } if (e.key === 'Escape') { setRoleVal(interviewer.role); setEditingRole(false); } }}
              autoFocus
              style={{
                fontSize: 'var(--text-sm)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)', padding: '1px var(--space-2)',
                background: 'var(--bg-primary)', color: 'var(--accent)', width: '100%', marginTop: '2px',
              }}
            />
          ) : (
            <div
              style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', marginTop: '2px', cursor: isAuthoring ? 'text' : 'default' }}
              onClick={() => { if (isAuthoring) { setRoleVal(interviewer.role); setEditingRole(true); } }}
            >
              {interviewer.role || (isAuthoring ? <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Set role...</span> : '')}
            </div>
          )}
        </div>

        {isAuthoring && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0, marginLeft: 'var(--space-2)' }}>
            <button disabled={index === 0} onClick={() => onReorder(index, 'up')} title="Move up"
              style={{ border: 'none', background: 'transparent', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)', fontSize: '12px', padding: '2px', opacity: index === 0 ? 0.4 : 1 }}>&#9650;</button>
            <button disabled={index === total - 1} onClick={() => onReorder(index, 'down')} title="Move down"
              style={{ border: 'none', background: 'transparent', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)', fontSize: '12px', padding: '2px', opacity: index === total - 1 ? 0.4 : 1 }}>&#9660;</button>
            {confirmDelete ? (
              <span style={{ display: 'flex', gap: '4px', fontSize: 'var(--text-xs)' }}>
                <button onClick={() => { onDelete(interviewer.id); setConfirmDelete(false); }}
                  style={{ border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '11px' }}>Confirm</button>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '11px' }}>Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDelete(true)} title="Delete"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '12px', padding: '2px' }}>&#10005;</button>
            )}
          </div>
        )}
      </div>

      {/* Profile fields */}
      <EditableField label="Background" value={interviewer.background} isAuthoring={isAuthoring} multiline
        onSave={v => onUpdate(interviewer.id, { background: v })} />
      <EditableField label="Will Probe" value={interviewer.will_probe} isAuthoring={isAuthoring} multiline
        onSave={v => onUpdate(interviewer.id, { will_probe: v })} />
      <EditableField label="My Angle" value={interviewer.my_angle} isAuthoring={isAuthoring} multiline
        onSave={v => onUpdate(interviewer.id, { my_angle: v })} />
      <EditableField label="Likely Questions" value={interviewer.likely_questions} isAuthoring={isAuthoring} multiline
        onSave={v => onUpdate(interviewer.id, { likely_questions: v })} />
      <EditableField label="My Hook" value={interviewer.my_hook} isAuthoring={isAuthoring} multiline
        onSave={v => onUpdate(interviewer.id, { my_hook: v })} />
    </Card>
  );
}

export function WarRoom() {
  const { isAuthoring } = useSupabaseContent();
  const { interviewers, addInterviewer, updateInterviewer, deleteInterviewer, reorderInterviewers } = useInterviewers();
  const [addingName, setAddingName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleReorder = (index: number, dir: 'up' | 'down') => {
    const ids = interviewers.map(i => i.id);
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderInterviewers(ids);
  };

  const handleAdd = () => {
    if (addingName.trim()) {
      addInterviewer(addingName.trim());
      setAddingName('');
      setShowAdd(false);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>
          War Room
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Intelligence on the people in the room
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {interviewers.map((person, idx) => (
          <InterviewerCard
            key={person.id}
            interviewer={person}
            index={idx}
            total={interviewers.length}
            isAuthoring={isAuthoring}
            onUpdate={updateInterviewer}
            onDelete={deleteInterviewer}
            onReorder={handleReorder}
          />
        ))}
      </div>

      {isAuthoring && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          {showAdd ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                value={addingName}
                onChange={e => setAddingName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="Interviewer name..."
                autoFocus
                style={{
                  flex: 1, padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
                }}
              />
              <button onClick={handleAdd}
                style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                Add
              </button>
              <button onClick={() => { setShowAdd(false); setAddingName(''); }}
                style={{ padding: 'var(--space-2) var(--space-3)', background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: '100%', padding: 'var(--space-3)', background: 'transparent',
                color: 'var(--accent)', border: '1px dashed var(--accent)',
                borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', cursor: 'pointer',
              }}
            >
              + Add interviewer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
