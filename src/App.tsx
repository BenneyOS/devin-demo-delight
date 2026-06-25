import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { getContentByModule } from './content';
import { Dashboard } from './modules/Dashboard';
import { ModuleView } from './modules/ModuleView';
import { SourceLibrary } from './modules/SourceLibrary';
import { PresenterMode } from './presenter/PresenterMode';
import './index.css';

type Page = 'dashboard' | 'thesis' | 'account-intel' | 'repo-rationale' | 'discovery' | 'devin-narrative' | 'competitive' | 'mastery' | 'sources' | 'presenter';

const NAV_ITEMS: { key: Page; label: string; shortLabel: string }[] = [
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { key: 'thesis', label: 'The Thesis', shortLabel: 'Thesis' },
  { key: 'account-intel', label: 'Account Intelligence', shortLabel: 'Account' },
  { key: 'repo-rationale', label: 'Repo Rationale', shortLabel: 'Repo' },
  { key: 'discovery', label: 'Discovery Engine', shortLabel: 'Discovery' },
  { key: 'devin-narrative', label: 'Devin Narrative', shortLabel: 'Devin' },
  { key: 'competitive', label: 'Competitive Layer', shortLabel: 'Compete' },
  { key: 'mastery', label: 'Mastery Module', shortLabel: 'Mastery' },
  { key: 'sources', label: 'Source Library', shortLabel: 'Sources' },
];

const MODULE_META: Record<string, { title: string; subtitle: string }> = {
  'thesis': { title: 'The Thesis', subtitle: 'From inputs to outcomes — the one idea this pitch hangs from' },
  'account-intel': { title: 'Account Intelligence', subtitle: 'CBA leadership, timing, and regulatory context' },
  'repo-rationale': { title: 'Repo Rationale', subtitle: 'Why bitwarden/clients is the defensible CBA proxy' },
  'discovery': { title: 'Discovery Engine', subtitle: 'Per-persona question banks that surface their pain' },
  'devin-narrative': { title: 'Devin Narrative', subtitle: 'How Devin works, the demo run-of-show, and proof points' },
  'competitive': { title: 'Competitive Layer', subtitle: 'Objection cards and the guarantee closer' },
  'mastery': { title: 'Mastery Module', subtitle: 'AE craft framework and deliberate practice' },
};

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
    setNavOpen(false);
  };

  if (presenterMode) {
    return <PresenterMode onExit={() => setPresenterMode(false)} />;
  }

  return (
    <div className="app-layout">
      {/* Mobile nav toggle */}
      <button
        onClick={() => setNavOpen(!navOpen)}
        aria-label="Toggle navigation"
        style={{
          display: 'none',
          position: 'fixed',
          top: 'var(--space-3)',
          left: 'var(--space-3)',
          zIndex: 200,
          width: 40,
          height: 40,
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: 'var(--text-primary)',
        }}
        className="mobile-nav-toggle"
      >
        {navOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Navigation */}
      <nav className={`app-nav ${navOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div style={{ padding: 'var(--space-6) var(--space-4)' }}>
          {/* Logo/Title */}
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-secondary)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Trusted Advisor OS
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Cognition M1 Prep
            </p>
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-2) var(--space-3)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: currentPage === item.key ? 'var(--accent-subtle)' : 'transparent',
                  color: currentPage === item.key ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: currentPage === item.key ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => { if (currentPage !== item.key) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (currentPage !== item.key) e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Bottom actions */}
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setPresenterMode(true)}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}
            >
              Presenter Mode
            </button>
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop for mobile */}
      {navOpen && (
        <div 
          onClick={() => setNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 50,
            display: 'none',
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Main content */}
      <main className="app-main">
        <div className="app-content">
          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={navigate} interviewDate="2026-07-10" />
          )}
          {currentPage === 'sources' && <SourceLibrary />}
          {currentPage !== 'dashboard' && currentPage !== 'sources' && currentPage !== 'presenter' && (
            <ModuleView 
              title={MODULE_META[currentPage]?.title || currentPage}
              subtitle={MODULE_META[currentPage]?.subtitle}
              items={getContentByModule(currentPage)}
            />
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav-toggle { display: flex !important; }
          .mobile-backdrop { display: block !important; }
        }
      `}</style>
    </div>
  );
}
