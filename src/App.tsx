import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { SupabaseContentProvider, useSupabaseContent } from './hooks/useSupabaseContent';
import { Dashboard } from './modules/Dashboard';
import { ModuleView } from './modules/ModuleView';
import { SourceLibrary } from './modules/SourceLibrary';
import { PresenterMode } from './presenter/PresenterMode';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { BackupExport } from './components/BackupExport';
import { OwnerKeyPrompt } from './components/OwnerKeyPrompt';
import './index.css';

type Page = 'dashboard' | 'sources' | 'presenter' | 'archive' | 'backup' | string;

function AppContent() {
  const [theme, toggleTheme] = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);

  const ctx = useSupabaseContent();
  const { loading, error, modules, getModuleItems, isAuthoring, isOwner, logout } = ctx;

  const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
    'thesis': { title: 'The Thesis', subtitle: 'From inputs to outcomes \u2014 the one idea this pitch hangs from' },
    'account-intel': { title: 'Account Intelligence', subtitle: 'CBA leadership, timing, and regulatory context' },
    'repo-rationale': { title: 'Repo Rationale', subtitle: 'Why bitwarden/clients is the defensible CBA proxy' },
    'discovery': { title: 'Discovery Engine', subtitle: 'Per-persona question banks that surface their pain' },
    'devin-narrative': { title: 'Devin Narrative', subtitle: 'How Devin works, the demo run-of-show, and proof points' },
    'competitive': { title: 'Competitive Layer', subtitle: 'Objection cards and the guarantee closer' },
    'mastery': { title: 'Mastery Module', subtitle: 'AE craft framework and deliberate practice' },
  };

  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard' },
    ...modules.map(slug => ({
      key: slug,
      label: MODULE_TITLES[slug]?.title || slug,
    })),
    { key: 'sources', label: 'Source Library' },
  ];

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
    setNavOpen(false);
  };

  if (presenterMode) {
    return <PresenterMode onExit={() => setPresenterMode(false)} />;
  }

  const isModule = currentPage !== 'dashboard' && currentPage !== 'sources' && currentPage !== 'presenter' && currentPage !== 'archive' && currentPage !== 'backup';

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-lg)',
      }}>
        Loading content...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary)',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
      }}>
        <p style={{ fontSize: 'var(--text-lg)', color: '#ef4444' }}>Failed to load content</p>
        <p style={{ fontSize: 'var(--text-sm)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <OwnerKeyPrompt />

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

          {/* Authoring Mode Section */}
          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-secondary)' }}>
            <button
              onClick={ctx.toggleAuthoring}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: `1px solid ${isAuthoring ? 'var(--warning)' : 'var(--border-primary)'}`,
                borderRadius: 'var(--radius-sm)',
                background: isAuthoring ? 'var(--warning-subtle)' : 'transparent',
                color: isAuthoring ? 'var(--warning)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                textAlign: 'left',
              }}
            >
              {isAuthoring ? 'Authoring ON' : 'Authoring Mode'}
            </button>

            {isAuthoring && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'var(--space-2)' }}>
                <button
                  onClick={() => navigate('archive')}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-2) var(--space-3)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: currentPage === 'archive' ? 'var(--accent-subtle)' : 'transparent',
                    color: currentPage === 'archive' ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Archive
                </button>
                <button
                  onClick={() => navigate('backup')}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-2) var(--space-3)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: currentPage === 'backup' ? 'var(--accent-subtle)' : 'transparent',
                    color: currentPage === 'backup' ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Backup Export
                </button>
              </div>
            )}

            {isOwner && (
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-1) var(--space-3)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Forget edit key
              </button>
            )}
          </div>

          {/* Bottom actions */}
          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
          {currentPage === 'archive' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Archive</h1>
              <ArchiveDrawer />
            </div>
          )}
          {currentPage === 'backup' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Backup</h1>
              <BackupExport />
            </div>
          )}
          {isModule && (
            <ModuleView
              module={currentPage}
              title={MODULE_TITLES[currentPage]?.title || currentPage}
              subtitle={MODULE_TITLES[currentPage]?.subtitle}
              items={getModuleItems(currentPage)}
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

export default function App() {
  return (
    <SupabaseContentProvider>
      <AppContent />
    </SupabaseContentProvider>
  );
}
