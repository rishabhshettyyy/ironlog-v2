/* ══════════════════════════════════════════════
   Dashboard/Sidebar.jsx — Navigation sidebar
   Author: Rishabh
══════════════════════════════════════════════ */
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'calendar', label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'log', label: 'Full Log',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'routine', label: 'Routine',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, onNavigate, mobileOpen, onMobileClose }) {
  const { user, isAdmin, logout } = useAuth();

  const navItems = isAdmin
    ? [...NAV_ITEMS, { id:'admin', label:'Admin', icon:(
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )}]
    : NAV_ITEMS;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:199, backdropFilter:'blur(2px)' }}
          onClick={onMobileClose}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-w, 224px)',
        minHeight: '100vh',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 200,
        transition: 'transform 0.3s var(--ease-out)',
        transform: mobileOpen ? 'translateX(0)' : undefined,
        '@media (max-width: 768px)': {
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        },
      }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 20px 24px', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:22, color:'var(--accent)', lineHeight:1 }}>⬡</span>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:22, letterSpacing:'.04em', textTransform:'uppercase' }}>IronLog</span>
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', flexDirection:'column', gap:3, padding:'18px 12px', flex:1 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onMobileClose?.(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                border: 'none',
                background: activePage === item.id ? 'var(--accent-bg)' : 'transparent',
                color: activePage === item.id ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: activePage === item.id ? 600 : 500,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                textAlign: 'left',
                width: '100%',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (activePage !== item.id) { e.currentTarget.style.background='var(--bg-3)'; e.currentTarget.style.color='var(--text)'; } }}
              onMouseLeave={e => { if (activePage !== item.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-2)'; } }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'admin' && (
                <span className="tag tag-orange" style={{ fontSize:9, marginLeft:'auto' }}>ADMIN</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding:'14px 16px 0', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{
              width:34, height:34, borderRadius:'50%',
              background:'var(--accent-bg)', border:'1px solid rgba(232,255,71,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontSize:14, fontWeight:900, color:'var(--accent)',
              flexShrink:0,
            }}>
              {user?.avatarInitials || user?.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full btn-sm" onClick={logout} style={{ justifyContent:'flex-start', gap:8, color:'var(--text-3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
