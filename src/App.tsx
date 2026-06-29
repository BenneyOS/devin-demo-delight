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
import { CategoryNav } from './components/CategoryNav';
import { WarRoom } from './modules/WarRoom';
import { BrandMark } from './components/BrandMark';
import './index.css';

type Page = 'dashboard' | 'sources' | 'presenter' | 'archive' | 'backup' | 'warroom' | string;

function AppContent() {
  const [theme, toggleTheme] = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);

  const ctx = useSupabaseContent();
  const {
    loading, error, moduleObjects, getModuleItems,
    isAuthoring, isOwner, logout,
    renameModule, archiveModule, reorderModuleList, addNewModule,
    getModuleItemCount,
  } = ctx;

  const navigate = (page: string) => {
    setCurrentPage(page as Page);
    setNavOpen(false);
  };

  if (presenterMode) {
    return <PresenterMode onExit={() => setPresenterMode(false)} />;
  }

  const isModule = currentPage !== 'dashboard' && currentPage !== 'sources' && currentPage !== 'presenter' && currentPage !== 'archive' && currentPage !== 'backup' && currentPage !== 'warroom';

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
          {/* Brand mark + engagement header */}
          <div style={{ marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <BrandMark size={28} />
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Trusted Advisor OS
              </h2>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.02em', lineHeight: 1.4 }}>
              Cognition <span style={{ color: 'var(--text-secondary)' }}>&times;</span> Commonwealth Bank of Australia
            </p>
          </div>

          {/* Dashboard + War Room nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: 'var(--space-4)' }}>
            <button
              onClick={() => navigate('dashboard')}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: 'var(--space-2) var(--space-3)', border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: currentPage === 'dashboard' ? 'var(--accent-subtle)' : 'transparent',
                color: currentPage === 'dashboard' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: currentPage === 'dashboard' ? 600 : 400, cursor: 'pointer',
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('warroom')}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: 'var(--space-2) var(--space-3)', border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: currentPage === 'warroom' ? 'var(--accent-subtle)' : 'transparent',
                color: currentPage === 'warroom' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: currentPage === 'warroom' ? 600 : 400, cursor: 'pointer',
              }}
            >
              War Room
            </button>
          </div>

          {/* Module nav items */}
          <CategoryNav
            moduleObjects={moduleObjects}
            currentPage={currentPage}
            isAuthoring={isAuthoring}
            onNavigate={navigate}
            onRename={renameModule}
            onArchive={archiveModule}
            onAddCategory={() => { addNewModule('New Category'); }}
            onReorder={reorderModuleList}
            getModuleItemCount={getModuleItemCount}
          />

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
            <Dashboard onNavigate={navigate} />
          )}
          {currentPage === 'warroom' && <WarRoom />}
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
              title={moduleObjects.find(m => m.slug === currentPage)?.title || currentPage}
              subtitle={undefined}
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
