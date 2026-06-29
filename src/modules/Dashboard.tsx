import { useMemo, useState, useRef, useCallback } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { useStrategyContent, STRATEGY_DEFAULTS } from '../hooks/useStrategyContent';
import { getDueItems, getWeakestItems, getConfidenceLevel } from '../engine/sm2';
import { Card } from '../components/Card';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

interface Props {
  onNavigate: (page: string) => void;
}

function formatCountdown(isoStr: string): { headline: string; sub: string; isToday: boolean } {
  const target = new Date(isoStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dayName = target.toLocaleDateString('en-AU', { weekday: 'long' });
  const datePart = target.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const timePart = target.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });

  const isToday = diffDays <= 0;

  let countdown: string;
  if (isToday) {
    countdown = 'Today';
  } else if (diffHours < 48) {
    const hrs = Math.ceil(diffHours);
    countdown = `${hrs} hour${hrs !== 1 ? 's' : ''} away`;
  } else {
    countdown = `${diffDays} day${diffDays !== 1 ? 's' : ''} away`;
  }

  return {
    headline: `${dayName} ${datePart} · ${timePart}`,
    sub: countdown,
    isToday,
  };
}

// ── Inline editable field (for strategy view) ──

function EditableStrategyField({
  fieldKey,
  value,
  isAuthoring,
  isCustomized,
  onSave,
  onReset,
  as = 'p',
  style,
  multiline = false,
}: {
  fieldKey: string;
  value: string;
  isAuthoring: boolean;
  isCustomized: boolean;
  onSave: (key: string, val: string) => void;
  onReset: (key: string) => void;
  as?: 'p' | 'h2' | 'span' | 'div';
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (draft.trim() !== value) {
      onSave(fieldKey, draft.trim());
    }
    setEditing(false);
  }, [draft, value, onSave, fieldKey]);

  if (editing && isAuthoring) {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: 'var(--space-2) var(--space-3)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      resize: 'vertical' as const,
    };

    return (
      <div style={{ position: 'relative' }}>
        {multiline ? (
          <textarea
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(() => {
                if (e.target.value.trim() !== value) onSave(fieldKey, e.target.value.trim());
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
                if (e.target.value.trim() !== value) onSave(fieldKey, e.target.value.trim());
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
        {isCustomized && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(fieldKey); setDraft(STRATEGY_DEFAULTS[fieldKey] || ''); setEditing(false); }}
            style={{
              position: 'absolute', top: -8, right: -8,
              fontSize: '10px', padding: '2px 6px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            title="Reset to default"
          >
            Reset
          </button>
        )}
      </div>
    );
  }

  const Tag = as;
  return (
    <Tag
      style={{
        ...style,
        cursor: isAuthoring ? 'text' : 'default',
        position: 'relative',
      }}
      onClick={() => { if (isAuthoring) { setDraft(value); setEditing(true); } }}
    >
      {value}
      {isAuthoring && isCustomized && (
        <span style={{ marginLeft: 6, fontSize: '9px', color: 'var(--accent)', verticalAlign: 'super' }}>edited</span>
      )}
    </Tag>
  );
}

// ── Prep Map ──

interface PrepMapTile {
  sections: string[];
  supports: string;
  routes: { label: string; route: string }[];
}

const PREP_MAP: PrepMapTile[] = [
  {
    sections: ['Discovery Engine', 'CBA Intelligence'],
    supports: 'fuels Act 1 (Diagnose)',
    routes: [
      { label: 'Discovery Engine', route: 'discovery' },
      { label: 'CBA Intelligence', route: 'cba-intelligence' },
    ],
  },
  {
    sections: ['Demo', 'Devin Workflows'],
    supports: 'fuels Act 2 (Prove)',
    routes: [
      { label: 'Demo', route: 'demo-angular-bitwarden-rationale' },
      { label: 'Devin Workflows', route: 'devin-workflows-map-to-pain' },
    ],
  },
  {
    sections: ['Thesis', 'Compete'],
    supports: 'fuels Act 3 (Walk away)',
    routes: [
      { label: 'Thesis', route: 'thesis-devin-narrative' },
      { label: 'Compete', route: 'compete-positioning' },
    ],
  },
  {
    sections: ['War Room', 'Interviewer Insights'],
    supports: "who's across the table",
    routes: [
      { label: 'War Room', route: 'warroom' },
      { label: 'Interviewer Insights', route: 'interviewer-insights' },
    ],
  },
];

export function Dashboard({ onNavigate }: Props) {
  const {
    activeContent, modules, moduleObjects, getDrillableItems,
    interviewAt, setInterviewAt, isAuthoring,
  } = useSupabaseContent();

  const strategy = useStrategyContent();

  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const drillableItems = useMemo(() => getDrillableItems(), [getDrillableItems]);
  const dueItemIds = useMemo(() => getDueItems(drillableItems.map(i => i.id)), [drillableItems]);
  const weakestIds = useMemo(() => getWeakestItems(drillableItems.map(i => i.id), 5), [drillableItems]);

  const weakestItems = useMemo(() =>
    weakestIds.map(id => activeContent.find(c => c.id === id)).filter(Boolean),
    [weakestIds, activeContent]
  );

  const effectiveDate = interviewAt || '2026-07-01T14:00:00+10:00';
  const countdown = useMemo(() => formatCountdown(effectiveDate), [effectiveDate]);

  const moduleProgress = useMemo(() => {
    return modules.map(slug => {
      const moduleItems = drillableItems.filter(i => i.module === slug);
      const modObj = moduleObjects.find(m => m.slug === slug);
      const label = modObj?.title || slug;
      if (moduleItems.length === 0) return { key: slug, label, progress: 100, total: 0, reviewed: 0 };
      const reviewed = moduleItems.filter(i => {
        const level = getConfidenceLevel(i.id);
        return level !== 'new';
      }).length;
      return { key: slug, label, progress: Math.round((reviewed / moduleItems.length) * 100), total: moduleItems.length, reviewed };
    });
  }, [modules, moduleObjects, drillableItems]);

  // Check which modules exist for prep map link validation
  const availableRoutes = useMemo(() => {
    const set = new Set<string>(modules);
    set.add('warroom'); // always available as a page
    return set;
  }, [modules]);

  const handleEditDate = () => {
    const d = new Date(effectiveDate);
    const localDate = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const localTime = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // HH:MM
    setDateInput(localDate);
    setTimeInput(localTime);
    setEditingDate(true);
  };

  const handleSaveDate = () => {
    if (dateInput && timeInput) {
      const newDate = new Date(`${dateInput}T${timeInput}:00`).toISOString();
      setInterviewAt(newDate);
    }
    setEditingDate(false);
  };

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════
          STRATEGY VIEW — "Strategy at a Glance"
          ═══════════════════════════════════════════════════════ */}

      {/* §1 — The Narrative (top headline) */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <EditableStrategyField
          fieldKey="narrative"
          value={strategy.getField('narrative')}
          isAuthoring={isAuthoring}
          isCustomized={strategy.isCustomized('narrative')}
          onSave={strategy.setField}
          onReset={strategy.resetField}
          as="p"
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            letterSpacing: '-0.01em',
          }}
          multiline
        />

        {/* Context strip: CBA · day · time · countdown */}
        <div style={{
          marginTop: 'var(--space-3)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
        }}>
          <span>CBA</span>
          <span style={{ color: 'var(--border-primary)' }}>&middot;</span>
          <span>{countdown.headline}</span>
          <span style={{ color: 'var(--border-primary)' }}>&middot;</span>
          <span style={{
            color: countdown.isToday ? 'var(--success)' : 'var(--accent)',
            fontWeight: 500,
          }}>
            {countdown.sub}
          </span>
          {isAuthoring && !editingDate && (
            <button
              onClick={handleEditDate}
              style={{
                marginLeft: 'var(--space-2)',
                padding: '1px var(--space-2)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Edit date
            </button>
          )}
        </div>

        {editingDate && (
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
              }}
            />
            <input
              type="time"
              value={timeInput}
              onChange={e => setTimeInput(e.target.value)}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
              }}
            />
            <button
              onClick={handleSaveDate}
              style={{
                padding: 'var(--space-1) var(--space-3)',
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
              onClick={() => setEditingDate(false)}
              style={{
                padding: 'var(--space-1) var(--space-3)',
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
        )}
      </section>

      {/* §2.1 — THE GOAL (success-tinted block) */}
      <section style={{
        background: 'var(--success-subtle)',
        border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5) var(--space-6)',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--success)',
          fontWeight: 600,
          marginBottom: 'var(--space-2)',
        }}>
          The Goal
        </div>
        <EditableStrategyField
          fieldKey="goal"
          value={strategy.getField('goal')}
          isAuthoring={isAuthoring}
          isCustomized={strategy.isCustomized('goal')}
          onSave={strategy.setField}
          onReset={strategy.resetField}
          as="p"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
          multiline
        />
      </section>

      {/* §2.2 — THE APPROACH (three act cards) */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}>
          The Approach
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {[
            { num: '01', titleKey: 'act1_title', bodyKey: 'act1_body' },
            { num: '02', titleKey: 'act2_title', bodyKey: 'act2_body' },
            { num: '03', titleKey: 'act3_title', bodyKey: 'act3_body' },
          ].map(act => (
            <div
              key={act.num}
              style={{
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                background: 'var(--bg-primary)',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-tertiary)',
                fontWeight: 400,
                marginBottom: 'var(--space-2)',
                opacity: 0.6,
              }}>
                {act.num}
              </div>
              <EditableStrategyField
                fieldKey={act.titleKey}
                value={strategy.getField(act.titleKey)}
                isAuthoring={isAuthoring}
                isCustomized={strategy.isCustomized(act.titleKey)}
                onSave={strategy.setField}
                onReset={strategy.resetField}
                as="h2"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              />
              <EditableStrategyField
                fieldKey={act.bodyKey}
                value={strategy.getField(act.bodyKey)}
                isAuthoring={isAuthoring}
                isCustomized={strategy.isCustomized(act.bodyKey)}
                onSave={strategy.setField}
                onReset={strategy.resetField}
                as="p"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </section>

      {/* §2.3 — WALK AWAY WITH (three line items with icons) */}
      <section style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5) var(--space-6)',
        marginBottom: 'var(--space-8)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}>
          Walk Away With
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {['walkaway_1', 'walkaway_2', 'walkaway_3'].map((key, idx) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <span style={{
                flexShrink: 0,
                width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-subtle)',
                borderRadius: '50%',
                fontSize: '12px',
                color: 'var(--accent)',
                fontWeight: 600,
              }}>
                {idx === 0 ? '🎯' : idx === 1 ? '📊' : '→'}
              </span>
              <EditableStrategyField
                fieldKey={key}
                value={strategy.getField(key)}
                isAuthoring={isAuthoring}
                isCustomized={strategy.isCustomized(key)}
                onSave={strategy.setField}
                onReset={strategy.resetField}
                as="p"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  flex: 1,
                }}
                multiline
              />
            </div>
          ))}
        </div>
      </section>

      {/* §3 — Prep Map ("everything else supports these three acts") */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}>
          Prep Map
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {PREP_MAP.map((tile, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                background: 'var(--bg-primary)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                {tile.routes.map(r => {
                  const exists = availableRoutes.has(r.route);
                  if (exists) {
                    return (
                      <button
                        key={r.route}
                        onClick={() => onNavigate(r.route)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: 'var(--accent)', fontSize: 'var(--text-sm)',
                          fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                          textDecoration: 'underline', textUnderlineOffset: '2px',
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  }
                  return (
                    <span key={r.route} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {r.label}
                    </span>
                  );
                })}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                → {tile.supports}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reset all (authoring only) ── */}
      {isAuthoring && (
        <div style={{ marginBottom: 'var(--space-8)', textAlign: 'right' }}>
          <button
            onClick={() => { if (confirm('Reset all strategy fields to their seeded defaults?')) strategy.resetAll(); }}
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-1) var(--space-3)',
              cursor: 'pointer',
            }}
          >
            Reset all to defaults
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          BELOW THE FOLD — Original dashboard widgets
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        borderTop: '1px solid var(--border-secondary)',
        paddingTop: 'var(--space-8)',
        marginTop: 'var(--space-4)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
        }}>
          Mastery Tracking
        </div>

        {/* Due Today */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Due Today
            <span style={{
              marginLeft: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: dueItemIds.length > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
              fontWeight: 500,
            }}>
              {dueItemIds.length}
            </span>
          </h2>
          {dueItemIds.length === 0 ? (
            <Card variant="outlined" padding="md">
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                All caught up. Start drilling a module to populate your review queue.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {dueItemIds.slice(0, 5).map(id => {
                const item = activeContent.find(c => c.id === id);
                if (!item) return null;
                return (
                  <Card key={id} variant="outlined" padding="sm" onClick={() => onNavigate(item.module)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <ConfidenceBadge confidence={item.confidence} />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{item.title}</span>
                    </div>
                  </Card>
                );
              })}
              {dueItemIds.length > 5 && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', paddingLeft: 'var(--space-2)' }}>
                  + {dueItemIds.length - 5} more
                </p>
              )}
            </div>
          )}
        </section>

        {/* Weakest Areas */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Weakest Areas
          </h2>
          {weakestItems.length === 0 ? (
            <Card variant="outlined" padding="md">
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Start drilling to build your confidence profile.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {weakestItems.map(item => {
                if (!item) return null;
                const level = getConfidenceLevel(item.id);
                const colors: Record<string, string> = { new: 'var(--text-tertiary)', weak: '#ef4444', learning: 'var(--warning)', strong: 'var(--success)' };
                return (
                  <Card key={item.id} variant="outlined" padding="sm" onClick={() => onNavigate(item.module)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{item.title}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: colors[level], fontWeight: 500, textTransform: 'capitalize' }}>
                        {level}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Learning Path Progress */}
        <section>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Learning Path
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {moduleProgress.map(mod => (
              <div
                key={mod.key}
                onClick={() => onNavigate(mod.key)}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(mod.key); }}
                tabIndex={0}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{mod.label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {mod.total > 0 ? `${mod.reviewed}/${mod.total}` : 'No drills'}
                  </span>
                </div>
                <div style={{
                  height: 4,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${mod.progress}%`,
                    background: mod.progress === 100 ? 'var(--success)' : 'var(--accent)',
                    borderRadius: 2,
                    transition: 'width var(--transition-base)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
