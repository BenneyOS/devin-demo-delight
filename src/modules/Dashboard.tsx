import { useMemo, useState } from 'react';
import { useSupabaseContent } from '../hooks/useSupabaseContent';
import { getDueItems, getWeakestItems, getConfidenceLevel } from '../engine/sm2';
import { Card } from '../components/Card';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

interface Interviewer {
  id: string;
  name: string;
  role: string;
  my_angle: string;
}

interface Props {
  onNavigate: (page: string) => void;
  interviewers?: Interviewer[];
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

export function Dashboard({ onNavigate, interviewers = [] }: Props) {
  const {
    activeContent, modules, moduleObjects, getDrillableItems,
    interviewAt, setInterviewAt, isAuthoring,
  } = useSupabaseContent();

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
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          From Inputs to Outcomes
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Your learning and performance environment
        </p>
      </header>

      {/* Interview Countdown */}
      <Card variant="elevated" padding="md">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interview countdown
            </span>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
              {countdown.headline}
            </div>
            <div style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: countdown.isToday ? 'var(--success)' : 'var(--accent)',
              marginTop: '2px',
            }}>
              {countdown.sub}
            </div>
            {countdown.isToday && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', fontStyle: 'italic' }}>
                Your personas take their seats today
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <div>{dueItemIds.length} items due today</div>
            <div>{drillableItems.length} total drillable items</div>
            {isAuthoring && !editingDate && (
              <button
                onClick={handleEditDate}
                style={{
                  marginTop: 'var(--space-2)',
                  padding: '2px var(--space-2)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Edit date
              </button>
            )}
          </div>
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
      </Card>

      {/* Interviewer War Room Summary */}
      {interviewers.length > 0 && (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>In the Room</span>
            <button
              onClick={() => onNavigate('warroom')}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Full profiles &rarr;
            </button>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {interviewers.map(p => (
              <Card key={p.id} variant="outlined" padding="sm" onClick={() => onNavigate('warroom')}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {p.role}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {p.my_angle}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Due Today */}
      <section style={{ marginTop: 'var(--space-8)' }}>
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
      <section style={{ marginTop: 'var(--space-8)' }}>
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
      <section style={{ marginTop: 'var(--space-8)' }}>
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
  );
}
