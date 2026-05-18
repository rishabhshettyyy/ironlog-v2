/* ══════════════════════════════════════════════
   pages/AdminPage.jsx
   Admin dashboard:
     - List all users, change role, delete
     - View any user's exercises / routine / metrics
     - Create / edit / delete gym closure notices
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useEffect } from 'react';
import { adminApi, gymClosureApi } from '../services/api';
import Modal from '../components/UI/Modal';
import Spinner from '../components/UI/Spinner';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}

export default function AdminPage({ addToast }) {
  const [tab,      setTab]      = useState('users');  // 'users' | 'closures'
  const [users,    setUsers]    = useState([]);
  const [closures, setClosures] = useState([]);
  const [loading,  setLoading]  = useState(false);

  /* Selected user panel */
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [userExercises,   setUserExercises]   = useState([]);
  const [userRoutine,     setUserRoutine]     = useState(null);
  const [userDataTab,     setUserDataTab]     = useState('exercises');
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [searchUser,      setSearchUser]      = useState('');

  /* Closure modal */
  const [closureModal, setClosureModal] = useState(null); // null | 'new' | closure object
  const [closureForm,  setClosureForm]  = useState({ date:'', title:'Gym Closed', reason:'', endDate:'' });
  const [savingClosure,setSavingClosure]= useState(false);

  /* Load on tab change */
  useEffect(() => {
    if (tab === 'users')    fetchUsers();
    if (tab === 'closures') fetchClosures();
  }, [tab]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setUsers(data);
    } catch { addToast('Failed to load users', 'error'); }
    finally  { setLoading(false); }
  }

  async function fetchClosures() {
    setLoading(true);
    try {
      const { data } = await gymClosureApi.getByMonth();
      setClosures(data);
    } catch { addToast('Failed to load closures', 'error'); }
    finally  { setLoading(false); }
  }

  async function fetchUserData(user) {
    setSelectedUser(user);
    setUserDataLoading(true);
    setUserExercises([]);
    setUserRoutine(null);
    try {
      const { data: ex } = await adminApi.getUserExercises(user._id, { search: searchUser });
      setUserExercises(ex);
      const { data: rt } = await adminApi.getUserRoutine(user._id);
      setUserRoutine(rt);
    } catch { addToast('Failed to load user data', 'error'); }
    finally  { setUserDataLoading(false); }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const { data } = await adminApi.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      addToast(`Role updated to ${newRole}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update role', 'error');
    }
  }

  async function handleDeleteUser(user) {
    if (!confirm(`Permanently delete ${user.name} and ALL their data?`)) return;
    try {
      await adminApi.deleteUser(user._id);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      if (selectedUser?._id === user._id) setSelectedUser(null);
      addToast('User deleted.', 'success');
    } catch { addToast('Delete failed.', 'error'); }
  }

  /* Search user exercises live */
  async function handleUserSearch(val) {
    setSearchUser(val);
    if (!selectedUser) return;
    try {
      const { data } = await adminApi.getUserExercises(selectedUser._id, { search: val });
      setUserExercises(data);
    } catch {}
  }

  /* Gym closure CRUD */
  const openNewClosure = () => {
    setClosureForm({ date:'', title:'Gym Closed', reason:'', endDate:'' });
    setClosureModal('new');
  };
  const openEditClosure = (c) => {
    setClosureForm({ date:c.date, title:c.title, reason:c.reason, endDate:c.endDate||'' });
    setClosureModal(c);
  };

  async function handleSaveClosure() {
    if (!closureForm.date)   { addToast('Date required', 'error'); return; }
    if (!closureForm.reason) { addToast('Reason required', 'error'); return; }
    setSavingClosure(true);
    try {
      if (closureModal === 'new') {
        const { data } = await gymClosureApi.create(closureForm);
        setClosures(prev => [...prev, data].sort((a,b)=>a.date.localeCompare(b.date)));
        addToast('Closure notice created!', 'success');
      } else {
        const { data } = await gymClosureApi.update(closureModal._id, closureForm);
        setClosures(prev => prev.map(c => c._id === data._id ? data : c));
        addToast('Closure notice updated!', 'success');
      }
      setClosureModal(null);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save closure', 'error');
    } finally { setSavingClosure(false); }
  }

  async function handleDeleteClosure(id) {
    if (!confirm('Delete this closure notice?')) return;
    try {
      await gymClosureApi.delete(id);
      setClosures(prev => prev.filter(c => c._id !== id));
      addToast('Notice deleted.', 'success');
    } catch { addToast('Delete failed.', 'error'); }
  }

  const WEEK_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <h2 style={{ fontSize:28 }}>Admin Dashboard</h2>

      {/* Tab bar */}
      <div className="toggle-group" style={{ width:'fit-content' }}>
        <button className={`toggle-btn ${tab==='users'?'active':''}`} onClick={() => setTab('users')}>Users</button>
        <button className={`toggle-btn ${tab==='closures'?'active':''}`} onClick={() => setTab('closures')}>Gym Closures</button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div style={{ display:'flex', gap:16 }}>

          {/* User list */}
          <div style={{ flex:'0 0 280px', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ color:'var(--text-3)', fontSize:12 }}>{users.length} users</div>
            {loading ? <Spinner /> : users.map(u => (
              <div
                key={u._id}
                onClick={() => fetchUserData(u)}
                style={{
                  background: selectedUser?._id === u._id ? 'var(--accent-bg)' : 'var(--bg-2)',
                  border: `1px solid ${selectedUser?._id === u._id ? 'rgba(232,255,71,0.3)' : 'var(--border)'}`,
                  borderRadius:'var(--radius-sm)', padding:'10px 14px',
                  cursor:'pointer', transition:'all 0.15s',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                    <div style={{ color:'var(--text-3)', fontSize:11 }}>{u.email}</div>
                  </div>
                  <span className={`tag ${u.role==='admin'?'tag-orange':'tag-blue'}`} style={{ fontSize:9 }}>{u.role}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User detail panel */}
          {selectedUser && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div>
                  <h3 style={{ fontSize:18 }}>{selectedUser.name}</h3>
                  <div style={{ color:'var(--text-3)', fontSize:12 }}>
                    {selectedUser.email} · Member since {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <select
                    className="select"
                    style={{ width:'auto' }}
                    value={selectedUser.role}
                    onChange={e => handleRoleChange(selectedUser._id, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(selectedUser)}>
                    Delete User
                  </button>
                </div>
              </div>

              {/* Live search over user's exercises */}
              <input
                className="input"
                placeholder="🔍 Search this user's exercises…"
                value={searchUser}
                onChange={e => handleUserSearch(e.target.value)}
              />

              {/* Sub tabs */}
              <div className="toggle-group" style={{ width:'fit-content' }}>
                <button className={`toggle-btn ${userDataTab==='exercises'?'active':''}`} onClick={() => setUserDataTab('exercises')}>Exercises</button>
                <button className={`toggle-btn ${userDataTab==='routine'?'active':''}`} onClick={() => setUserDataTab('routine')}>Routine</button>
              </div>

              {userDataLoading ? <Spinner /> : (
                <>
                  {/* Exercises table */}
                  {userDataTab === 'exercises' && (
                    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflowX:'auto' }}>
                      {userExercises.length === 0 ? (
                        <p className="empty-state">No exercises found.</p>
                      ) : (
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                          <thead>
                            <tr>
                              {['Date','Exercise','Type','Details','Notes'].map(h => (
                                <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:'1px solid var(--border)', background:'var(--bg-3)', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-3)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {userExercises.map(ex => (
                              <tr key={ex._id} style={{ borderBottom:'1px solid var(--border)' }}>
                                <td style={{ padding:'7px 12px', color:'var(--text-2)', whiteSpace:'nowrap' }}>{fmtDate(ex.date)}</td>
                                <td style={{ padding:'7px 12px', fontWeight:500 }}>{ex.name}</td>
                                <td style={{ padding:'7px 12px' }}><span className={`tag ${ex.type==='strength'?'tag-blue':'tag-green'}`} style={{ fontSize:9 }}>{ex.type}</span></td>
                                <td style={{ padding:'7px 12px', color:'var(--text-2)' }}>
                                  {ex.type==='strength' ? `${ex.weight??0}kg × ${ex.sets??'—'} × ${ex.reps??'—'}` : `${ex.duration} ${ex.durationUnit}`}
                                </td>
                                <td style={{ padding:'7px 12px', color:'var(--text-3)', fontStyle:'italic' }}>{ex.notes||'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Routine view */}
                  {userDataTab === 'routine' && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
                      {WEEK_DAYS.map(day => (
                        <div key={day} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
                          <div style={{ padding:'6px 8px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-2)', textAlign:'center' }}>
                            {day.slice(0,3)}
                          </div>
                          <div style={{ padding:8 }}>
                            {(!userRoutine || !userRoutine[day] || userRoutine[day].length === 0) ? (
                              <div style={{ fontSize:10, color:'var(--text-3)', textAlign:'center', fontStyle:'italic', padding:'8px 0' }}>Rest</div>
                            ) : userRoutine[day].map((ex, i) => (
                              <div key={i} style={{ fontSize:10, padding:'4px 6px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:4, marginBottom:4 }}>
                                <div style={{ fontWeight:600 }}>{ex.name}</div>
                                <div style={{ color:'var(--text-3)' }}>
                                  {ex.type==='strength' ? `${ex.weight}kg·${ex.sets}×${ex.reps}` : `${ex.duration} ${ex.durationUnit}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GYM CLOSURES TAB ── */}
      {tab === 'closures' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={openNewClosure}>+ Add Closure Notice</button>
          </div>

          {loading ? <Spinner /> : closures.length === 0 ? (
            <p className="empty-state">No gym closure notices.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {closures.map(c => (
                <div key={c._id} className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'14px 18px' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>
                      {c.title}
                      <span style={{ marginLeft:8, fontFamily:'var(--font-display)', fontSize:12, color:'var(--accent)' }}>
                        {fmtDate(c.date)}{c.endDate ? ` → ${fmtDate(c.endDate)}` : ''}
                      </span>
                    </div>
                    <div style={{ color:'var(--text-2)', fontSize:13, marginTop:2 }}>{c.reason}</div>
                    <div style={{ color:'var(--text-3)', fontSize:11, marginTop:4 }}>Added by {c.createdBy?.name}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditClosure(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClosure(c._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Closure modal */}
      {closureModal && (
        <Modal
          title={closureModal === 'new' ? 'Add Closure Notice' : 'Edit Closure Notice'}
          onClose={() => setClosureModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setClosureModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveClosure} disabled={savingClosure}>
              {savingClosure ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          <div className="form-group">
            <label className="label">Date</label>
            <input className="input" type="date" value={closureForm.date} onChange={e => setClosureForm(p=>({...p,date:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="label">End Date <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, fontSize:11, color:'var(--text-3)' }}>(optional — for multi-day closures)</span></label>
            <input className="input" type="date" value={closureForm.endDate} onChange={e => setClosureForm(p=>({...p,endDate:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={closureForm.title} onChange={e => setClosureForm(p=>({...p,title:e.target.value}))} placeholder="Gym Closed" />
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <textarea className="input" rows="2" value={closureForm.reason} onChange={e => setClosureForm(p=>({...p,reason:e.target.value}))} placeholder="e.g. Scheduled maintenance" />
          </div>
        </Modal>
      )}
    </div>
  );
}
