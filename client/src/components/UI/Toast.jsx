/* ══════════════════════════════════════════════
   UI/Toast.jsx — Toast notification container
   Author: Rishabh
══════════════════════════════════════════════ */
import React from 'react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => removeToast(t.id)}
          role="alert"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
