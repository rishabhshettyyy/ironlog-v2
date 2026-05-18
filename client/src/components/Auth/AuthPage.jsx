/* ══════════════════════════════════════════════
   Auth/AuthPage.jsx — Login + Register screen
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', heightCm: '',
  });

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          name:     form.name,
          email:    form.email,
          password: form.password,
          heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, color:'var(--accent)', marginBottom: 8 }}>⬡</div>
          <h1 style={{ fontSize: 36, letterSpacing: '0.08em', color:'var(--text)' }}>IRONLOG</h1>
          <p style={{ color:'var(--text-3)', fontSize: 13, marginTop: 6 }}>
            Your personal workout tracker
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Mode tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)',
            padding: 3,
            gap: 3,
            marginBottom: 24,
          }}>
            {['login','register'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: 'none',
                  borderRadius: 4,
                  background: mode === m ? 'var(--bg-2)' : 'transparent',
                  color: mode === m ? 'var(--accent)' : 'var(--text-2)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="label">
                  Height (cm) <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, fontSize:11, color:'var(--text-3)' }}>(optional — used for BMI)</span>
                </label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 175"
                  min="50" max="300"
                  value={form.heightCm}
                  onChange={e => set('heightCm', e.target.value)}
                />
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--red-bg)',
                border: '1px solid rgba(255,77,77,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: 'var(--red)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 4, padding: '11px 0', fontSize: 14 }}
            >
              {loading ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', color:'var(--text-3)', fontSize:12, marginTop:16 }}>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, textDecoration:'underline' }}
          >
            {mode === 'login' ? 'Register here' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
