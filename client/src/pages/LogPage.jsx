/* ══════════════════════════════════════════════
   pages/LogPage.jsx
   Full exercise log — live search, filters,
   monthly summary stats, weight graph trigger.
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { exerciseApi, metricsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import WeightGraph from '../components/Graph/WeightGraph';
import Modal from '../components/UI/Modal';
import ExerciseForm from '../components/UI/ExerciseForm';
import Spinner from '../components/UI/Spinner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LogPage({ addToast }) {
  const { user } = useAuth();
  const now = new Date();

  /* Filter state — persists across renders via ref */
  const [search,    setSearch]    = useState('');
  const [typeFilter,setTypeFilter]= useState('');
  const [month,     setMonth]     = useState(
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  );

  const [exercises, setExercises] = useState([]);
  const [metrics,   setMetrics]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [editEx,    setEditEx]    = useState(null);   // exercise being edited
  const [editType,  setEditType]  = useState('strength');
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  /* Debounce search */
  const searchTimer = useRef(null);

  const fetchExercises = useCallback(async (s, t, m) => {
    setLoading(true);
    try {
      const { data } = await exerciseApi.getAll({ search: s, type: t, month: m });
      setExercises(data.sort((a,b) => b.date.localeCompare(a.date)));
    } catch (err) {
      addToast('Failed to load exercises', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* Fetch metrics for the graph (all time) */
  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await metricsApi.getRange();
      setMetrics(data);
    } catch { setMetrics([]); }
  }, []);

  useEffect(() => {
    fetchExercises(search, typeFilter, month);
    fetchMetrics();
  }, [typeFilter, month]);

  /* Live search with 300ms debounce */
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchExercises(val, typeFilter, month);
    }, 300);
  };

  /* Summary stats for current filtered set */
  const stats = {
    total:    exercises.length,
    strength: exercises.filter(e => e.type === 'strength').length,
    cardio:   exercises.filter(e => e.type === 'cardio').length,
    volume:   exercises
      .filter(e => e.type === 'strength')
      .reduce((s,e) => s + ((e.weight||0)*(e.sets||0)*(e.reps||0)), 0),
    activeDays: new Set(exercises.map(e => e.date)).size,
  };

  /* Delete */
  const handleDelete = async (ex) => {
    if (!confirm(`Delete "${ex.name}"?`)) return;
    try {
      await exerciseApi.delete(ex._id);
      setExercises(prev => prev.filter(e => e._id !== ex._id));
      addToast('Exercise deleted.', 'success');
    } catch {
      addToast('Delete failed.', 'error');
    }
  };

  /* Edit */
  const openEdit = (ex) => {
    setEditEx(ex);
    setEditType(ex.type);
    setEditForm({
      name: ex.name, category: ex.category,
      weight: ex.weight, sets: ex.sets, reps: ex.reps,
      duration: ex.duration, durationUnit: ex.durationUnit || 'minutes',
      notes: ex.notes || '',
    });
  };

  const handleEditSave = async () => {
    if (!editForm.name?.trim()) { addToast('Name required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...editForm, type: editType };
      const { data } = await exerciseApi.update(editEx._id, payload);
      setExercises(prev => prev.map(e => e._id === data._id ? data : e));
      setEditEx(null);
      addToast('Exercise updated!', 'success');
    } catch {
      addToast('Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:28 }}>Full Log</h2>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowGraph(true)}
          title="View weight / BMI trend graph"
        >
          📈 Weight Trends
        </button>
      </div>

      {/* Filters + live search */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <input
          className="input"
          style={{ flex:2, minWidth:180 }}
          placeholder="🔍 Search exercise name, notes, category…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          minLength={1}
        />
        <select
          className="select"
          style={{ flex:1, minWidth:120 }}
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); }}
        >
          <option value="">All types</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
        </select>
        <input
          className="input"
          type="month"
          style={{ flex:1, minWidth:140 }}
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
      </div>

      {/* Summary bar */}
      {!loading && exercises.length > 0 && (
        <div style={{
          display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
          background:'var(--bg-2)', border:'1px solid var(--border)',
          borderRadius:'var(--radius)', padding:'12px 18px',
        }}>
          <div style={{ flex:1, minWidth:120 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:2 }}>
              {month ? new Date(month+'-01').toLocaleString('default',{month:'long',year:'numeric'}) : 'Filtered'}
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, color:'var(--accent)' }}>
              {stats.total} <span style={{ fontSize:13, fontWeight:500, color:'var(--text-2)' }}>exercises</span>
            </div>
          </div>
          {[
            { label:'Active Days', value:stats.activeDays, unit:'days' },
            { label:'Strength',    value:stats.strength,   unit:'sessions' },
            { label:'Cardio',      value:stats.cardio,     unit:'sessions' },
            { label:'Volume',      value: stats.volume >= 1000 ? (stats.volume/1000).toFixed(1)+'k' : stats.volume, unit:'kg lifted' },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <div className="stat-chip__label">{s.label}</div>
              <div className="stat-chip__value">{s.value} <span className="stat-chip__unit">{s.unit}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflowX:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <Spinner />
          </div>
        ) : exercises.length === 0 ? (
          <p className="empty-state">No exercises found for the selected filters.</p>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>
                {['Date','Exercise','Category','Type','Details','Notes',''].map(h => (
                  <th key={h} style={{
                    padding:'10px 14px', textAlign:'left', borderBottom:'1px solid var(--border)',
                    background:'var(--bg-3)', fontFamily:'var(--font-display)',
                    fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-3)',
                    whiteSpace:'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercises.map(ex => (
                <tr key={ex._id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'9px 14px', color:'var(--text)', fontFamily:'var(--font-display)', fontWeight:600, whiteSpace:'nowrap' }}>
                    {formatDate(ex.date)}
                  </td>
                  <td style={{ padding:'9px 14px', fontWeight:500, color:'var(--text)' }}>
                    {ex.name}
                    {ex.isProgressive && <span style={{ marginLeft:6, fontSize:9, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 5px', borderRadius:3, background:'rgba(77,255,154,0.1)', color:'var(--green)' }}>↑ PO</span>}
                  </td>
                  <td style={{ padding:'9px 14px', color:'var(--text-2)' }}>{ex.category}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <span className={`tag ${ex.type === 'strength' ? 'tag-blue' : 'tag-green'}`} style={{ fontSize:10 }}>
                      {ex.type}
                    </span>
                  </td>
                  <td style={{ padding:'9px 14px', color:'var(--text-2)' }}>
                    {ex.type === 'strength'
                      ? `${ex.weight ?? 0}kg × ${ex.sets ?? '—'} × ${ex.reps ?? '—'}`
                      : `${ex.duration} ${ex.durationUnit}`}
                  </td>
                  <td style={{ padding:'9px 14px', color:'var(--text-3)', fontSize:12, fontStyle:'italic', maxWidth:160 }}>
                    {ex.notes || '—'}
                  </td>
                  <td style={{ padding:'9px 14px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(ex)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(ex)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editEx && (
        <Modal
          title="Edit Exercise"
          onClose={() => setEditEx(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditEx(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          <ExerciseForm
            values={editForm}
            onChange={(f,v) => setEditForm(prev => ({...prev, [f]:v}))}
            type={editType}
            onTypeChange={setEditType}
          />
        </Modal>
      )}

      {/* Weight graph */}
      {showGraph && (
        <WeightGraph
          metrics={metrics}
          heightCm={user?.heightCm}
          onClose={() => setShowGraph(false)}
        />
      )}
    </div>
  );
}
