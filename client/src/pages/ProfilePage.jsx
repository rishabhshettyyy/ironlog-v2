/* ══════════════════════════════════════════════
   pages/ProfilePage.jsx
   User profile — name, height, password change
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function ProfilePage({ addToast }) {
  const { user, updateUser, logout } = useAuth();

  const [form,    setForm]    = useState({ name: user?.name || '', heightCm: user?.heightCm || '' });
  const [saving,  setSaving]  = useState(false);

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { addToast('Name must be at least 2 characters.', 'error'); return; }
    setSaving(true);
    try {
      const { data } = await authApi.updateMe({
        name:     form.name.trim(),
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
      });
      updateUser(data);
      addToast('Profile updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* BMI calculation */
  const bmi = user?.heightCm && form.heightCm
    ? null  // shown in graph, not here
    : null;

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:520 }}>

      <h2 style={{ fontSize:28 }}>Profile</h2>

      {/* Avatar */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{
          width:64, height:64, borderRadius:'50%',
          background:'var(--accent-bg)', border:'2px solid rgba(232,255,71,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'var(--accent)',
        }}>
          {user?.avatarInitials || user?.name?.slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:16 }}>{user?.name}</div>
          <div style={{ color:'var(--text-3)', fontSize:13 }}>{user?.email}</div>
          <span className={`tag ${user?.role === 'admin' ? 'tag-orange' : 'tag-blue'}`} style={{ fontSize:10, marginTop:4, display:'inline-block' }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <h3 style={{ fontSize:15, marginBottom:16 }}>Edit Profile</h3>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">
              Height (cm)
              <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, fontSize:11, color:'var(--text-3)', marginLeft:6 }}>
                Used for BMI calculation in Weight Trends
              </span>
            </label>
            <input
              className="input"
              type="number" min="50" max="300"
              placeholder="e.g. 175"
              value={form.heightCm}
              onChange={e => set('heightCm', e.target.value)}
            />
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Account actions */}
      <div className="card">
        <h3 style={{ fontSize:15, marginBottom:12 }}>Account</h3>
        <p style={{ color:'var(--text-3)', fontSize:13, marginBottom:14 }}>
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-AU', { year:'numeric', month:'long' }) : '—'}
        </p>
        <button className="btn btn-danger btn-sm" onClick={logout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
