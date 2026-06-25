import { useMemo } from 'react';
import { allContent, getDrillableItems } from '../content';
import { getDueItems, getWeakestItems, getConfidenceLevel } from '../engine/sm2';
import { Card } from '../components/Card';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

interface Props {
  onNavigate: (page: string) => void;
  interviewDate?: string;
}

const MODULE_ORDER = [
  { key: 'thesis', label: 'The Thesis' },
  { key: 'account-intel', label: 'Account Intelligence' },
  { key: 'repo-rationale', label: 'Repo Rationale' },
  { key: 'discovery', label: 'Discovery Engine' },
  { key: 'devin-narrative', label: 'Devin Narrative' },
  { key: 'competitive', label: 'Competitive Layer' },
  { key: 'mastery', label: 'Mastery Module' },
];

export function Dashboard({ onNavigate, interviewDate }: Props) {
  const drillableItems = useMemo(() => getDrillableItems(), []);
  const dueItemIds = useMemo(() => getDueItems(drillableItems.map(i => i.id)), [drillableItems]);
  const weakestIds = useMemo(() => getWeakestItems(drillableItems.map(i => i.id), 5), [drillableItems]);
  
  const weakestItems = useMemo(() => 
    weakestIds.map(id => allContent.find(c => c.id === id)).filter(Boolean),
    [weakestIds]
  );

  const daysUntilInterview = useMemo(() => {
    if (!interviewDate) return null;
    const diff = new Date(interviewDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [interviewDate]);

  // Module progress (% of drillable items reviewed at least once)
  const moduleProgress = useMemo(() => {
    return MODULE_ORDER.map(mod => {
      const moduleItems = drillableItems.filter(i => i.module === mod.key);
      if (moduleItems.length === 0) return { ...mod, progress: 100, total: 0, reviewed: 0 };
      const reviewed = moduleItems.filter(i => {
        const level = getConfidenceLevel(i.id);
        return level !== 'new';
      }).length;
      return { ...mod, progress: Math.round((reviewed / moduleItems.length) * 100), total: moduleItems.length, reviewed };
    });
  }, [drillableItems]);

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

      {/* T-minus panel */}
      {daysUntilInterview !== null && (
        <Card variant="elevated" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Interview countdown
              </span>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--accent)' }}>
                T-{daysUntilInterview}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <div>{dueItemIds.length} items due today</div>
              <div>{drillableItems.length} total drillable items</div>
            </div>
          </div>
        </Card>
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
              const item = allContent.find(c => c.id === id);
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
