/* ══════════════════════════════════════════════
   UI/Modal.jsx — Reusable modal dialog
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer }) {
  /* Close on Escape key */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.25s var(--ease-out)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 0' }}>
          <h3 style={{ fontSize:18 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display:'flex', flexDirection:'column', gap:14 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'0 20px 20px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
