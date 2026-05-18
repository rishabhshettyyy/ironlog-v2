/* ══════════════════════════════════════════════
   App.jsx — Root component
   Handles: auth guard, layout, SPA navigation,
   toast system, mobile sidebar
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import Toast from './components/UI/Toast';
import Sidebar from './components/Dashboard/Sidebar';
import AuthPage from './components/Auth/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import CalendarPage from './pages/CalendarPage';
import LogPage from './pages/LogPage';
import RoutinePage from './pages/RoutinePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

/* ── Protected layout wrapper ── */
function AppLayout() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toasts, addToast, removeToast } = useToast();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [openDayDate,  setOpenDayDate]  = useState(null);

  /* Derive active page from URL path */
  const pathToPage = {
    '/':         'dashboard',
    '/calendar': 'calendar',
    '/log':      'log',
    '/routine':  'routine',
    '/profile':  'profile',
    '/admin':    'admin',
  };
  const activePage = pathToPage[location.pathname] || 'dashboard';

  const handleNavigate = useCallback((page) => {
    const pageToPath = {
      dashboard: '/', calendar: '/calendar', log: '/log',
      routine: '/routine', profile: '/profile', admin: '/admin',
    };
    navigate(pageToPath[page] || '/');
  }, [navigate]);

  /* Called from Dashboard "view today" button */
  const handleDayClick = useCallback((dateStr) => {
    setOpenDayDate(dateStr);
    navigate('/calendar');
  }, [navigate]);

  if (!user) return <Navigate to="/login" replace />;

  const SIDEBAR_W = 224;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <header style={{
        display: 'none',
        position: 'fixed', top:0, left:0, right:0,
        height: 56,
        background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
        zIndex: 150,
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        '@media (max-width: 768px)': { display: 'flex' },
      }}
        className="mobile-topbar"
      >
        <button
          className="icon-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:18, letterSpacing:'.06em', textTransform:'uppercase' }}>IronLog</span>
        <div style={{ width:34 }} />
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: SIDEBAR_W,
        minHeight: '100vh',
        padding: '36px 40px',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
        className="main-content"
      >
        <Routes>
          <Route path="/" element={<Dashboard onDayClick={handleDayClick} />} />
          <Route path="/calendar" element={<CalendarPage addToast={addToast} openDayDate={openDayDate} />} />
          <Route path="/log"      element={<LogPage      addToast={addToast} />} />
          <Route path="/routine"  element={<RoutinePage  addToast={addToast} />} />
          <Route path="/profile"  element={<ProfilePage  addToast={addToast} />} />
          <Route path="/admin"    element={
            user?.role === 'admin'
              ? <AdminPage addToast={addToast} />
              : <Navigate to="/" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Inline responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .main-content  { margin-left: 0 !important; padding: 72px 16px 24px !important; }
        }
        @media (max-width: 768px) {
          aside {
            transform: translateX(-100%);
          }
          aside.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ── Root with AuthProvider ── */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginGuard />} />
        <Route path="/*"     element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  );
}

/* Redirect to home if already logged in */
function LoginGuard() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}
