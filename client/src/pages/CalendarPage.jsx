/* ══════════════════════════════════════════════
   pages/CalendarPage.jsx
   Month grid calendar with:
     - Exercise pills per day
     - Gym closure notices
     - Day drawer (add/edit/delete exercises + health metrics)
     - Weekly summary bar
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { exerciseApi, gymClosureApi, metricsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import ExerciseForm from '../components/UI/ExerciseForm';
import Spinner from '../components/UI/Spinner';

/* ── Date helpers ── */
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDateStr(s) { return new Date(s + 'T00:00:00'); }

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Category colours ── */
const CAT_COLOUR = {
  'Upper Body':'#ff8c42','Lower Body':'#4da6ff','Core':'#b44dff',
  'Arms':'#ff4da6','Back':'#4dffd5','Shoulders':'#ffd24d',
  'Cardio':'#4dff9a','Active Rest':'#606060','Full Body':'#ff6b6b',
};

/* ── Empty exercise form state ── */
const EMPTY_FORM = { name:'', category:'', weight:'', sets:'', reps:'', duration:'', durationUnit:'minutes', notes:'' };

export default function CalendarPage({ addToast, openDayDate }) {
  const { user } = useAuth();
  const today = new Date();

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  /* Calendar data */
  const [calData,   setCalData]   = useState({}); // { 'YYYY-MM-DD': [exercises] }
  const [closures,  setClosures]  = useState({}); // { 'YYYY-MM-DD': closure }
  const [calLoading,setCalLoading]= useState(false);

  /* Drawer */
  const [drawerDate,     setDrawerDate]     = useState(null);
  const [drawerExercises,setDrawerExercises]= useState([]);
  const [drawerLoading,  setDrawerLoading]  = useState(false);
  const [metric,         setMetric]         = useState(null); // today's health metric

  /* Add form */
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState(EMPTY_FORM);
  const [addType,     setAddType]     = useState('strength');
  const [addSaving,   setAddSaving]   = useState(false);

  /* Edit modal */
  const [editEx,   setEditEx]   = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editType, setEditType] = useState('strength');
  const [editSaving,setEditSaving]=useState(false);

  /* Health metric form */
  const [metricForm,   setMetricForm]   = useState({ weightKg:'', caloriesKcal:'' });
  const [metricSaving, setMetricSaving] = useState(false);
  const [showMetric,   setShowMetric]   = useState(false);

  /* Open drawer from parent (Dashboard "view today") */
  useEffect(() => {
    if (openDayDate) openDrawer(openDayDate);
  }, [openDayDate]);

  /* ── Load calendar month data ── */
  const loadMonth = useCallback(async (y, m) => {
    setCalLoading(true);
    try {
      const [summaryRes, closureRes] = await Promise.all([
        exerciseApi.getSummary(y, m + 1),
        gymClosureApi.getByMonth(y, m + 1),
      ]);

      const data = {};
      summaryRes.data.forEach(item => { data[item.date] = item.exercises; });
      setCalData(data);

      const clos = {};
      closureRes.data.forEach(c => {
        // Mark every date in range
        const start = parseDateStr(c.date);
        const end   = c.endDate ? parseDateStr(c.endDate) : start;
        const cur   = new Date(start);
        while (cur <= end) {
          clos[toDateStr(cur)] = c;
          cur.setDate(cur.getDate() + 1);
        }
      });
      setClosures(clos);
    } catch (err) {
      addToast('Failed to load calendar data', 'error');
    } finally {
      setCalLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadMonth(year, month); }, [year, month]);

  /* ── Navigation ── */
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  /* ── Weekly summary ── */
  const weekSummary = useCallback(() => {
    const dow     = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday  = new Date(today); monday.setDate(today.getDate() - dow);
    const dates   = Array.from({ length:7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      return toDateStr(d);
    });
    const exs     = dates.flatMap(d => calData[d] || []);
    return {
      activeDays: dates.filter(d => (calData[d]||[]).length > 0).length,
      total:      exs.length,
      strength:   exs.filter(e => e.type === 'strength').length,
      cardio:     exs.filter(e => e.type === 'cardio').length,
      start:      `${monday.getDate()} ${MONTH_SHORT[monday.getMonth()]}`,
      end:        (() => { const s = new Date(monday); s.setDate(monday.getDate()+6); return `${s.getDate()} ${MONTH_SHORT[s.getMonth()]}`; })(),
    };
  }, [calData, today]);

  /* ── Build grid cells ── */
  const buildCells = () => {
    const cells = [];
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    let startDow = first.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

    const prevLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month-1, prevLast-i), other: true });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), other: false });
    }
    const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= rem; d++) {
      cells.push({ date: new Date(year, month+1, d), other: true });
    }
    return cells;
  };

  /* ── Open drawer ── */
  const openDrawer = async (dateStr) => {
    setDrawerDate(dateStr);
    setShowAddForm(false);
    setAddForm(EMPTY_FORM);
    setAddType('strength');
    setShowMetric(false);
    setDrawerLoading(true);

    try {
      const { data: exs } = await exerciseApi.getByDate(dateStr);
      setDrawerExercises(exs);
      try {
        const { data: m } = await metricsApi.getByDate(dateStr);
        setMetric(m);
        setMetricForm({ weightKg: m.weightKg||'', caloriesKcal: m.caloriesKcal||'' });
      } catch {
        setMetric(null);
        setMetricForm({ weightKg:'', caloriesKcal:'' });
      }
    } catch {
      addToast('Failed to load day data', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerDate(null);
    setDrawerExercises([]);
    setMetric(null);
    setShowAddForm(false);
    setShowMetric(false);
  };

  /* ── Add exercise ── */
  const handleAdd = async () => {
    if (!addForm.name?.trim()) { addToast('Name required', 'error'); return; }
    if (!addForm.category)     { addToast('Category required', 'error'); return; }
    if (addType === 'strength' && (!addForm.sets || !addForm.reps)) {
      addToast('Sets and reps required', 'error'); return;
    }
    if (addType === 'cardio' && !addForm.duration) {
      addToast('Duration required', 'error'); return;
    }
    setAddSaving(true);
    try {
      const { data } = await exerciseApi.create({
        date: drawerDate, name: addForm.name.trim(),
        category: addForm.category, type: addType,
        weight: addType === 'strength' ? parseFloat(addForm.weight)||0 : undefined,
        sets:   addType === 'strength' ? parseInt(addForm.sets)||null : undefined,
        reps:   addType === 'strength' ? parseInt(addForm.reps)||null : undefined,
        duration:     addType === 'cardio' ? parseFloat(addForm.duration)||null : undefined,
        durationUnit: addType === 'cardio' ? addForm.durationUnit : undefined,
        notes: addForm.notes?.trim() || null,
      });
      setDrawerExercises(prev => [...prev, data]);
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      await loadMonth(year, month);
      addToast('Exercise saved!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Save failed', 'error');
    } finally { setAddSaving(false); }
  };

  /* ── Edit exercise ── */
  const openEdit = (ex) => {
    setEditEx(ex);
    setEditType(ex.type);
    setEditForm({
      name: ex.name, category: ex.category,
      weight: ex.weight??'', sets: ex.sets??'', reps: ex.reps??'',
      duration: ex.duration??'', durationUnit: ex.durationUnit||'minutes',
      notes: ex.notes||'',
    });
  };
  const handleEditSave = async () => {
    if (!editForm.name?.trim()) { addToast('Name required', 'error'); return; }
    setEditSaving(true);
    try {
      const { data } = await exerciseApi.update(editEx._id, { ...editForm, type: editType });
      setDrawerExercises(prev => prev.map(e => e._id === data._id ? data : e));
      setEditEx(null);
      await loadMonth(year, month);
      addToast('Exercise updated!', 'success');
    } catch { addToast('Update failed', 'error'); }
    finally  { setEditSaving(false); }
  };

  /* ── Delete exercise ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this exercise?')) return;
    try {
      await exerciseApi.delete(id);
      setDrawerExercises(prev => prev.filter(e => e._id !== id));
      await loadMonth(year, month);
      addToast('Deleted.', 'success');
    } catch { addToast('Delete failed', 'error'); }
  };

  /* ── Health metric save ── */
  const handleMetricSave = async () => {
    if (!metricForm.weightKg && !metricForm.caloriesKcal) {
      addToast('Enter weight or calories', 'error'); return;
    }
    setMetricSaving(true);
    try {
      const { data } = await metricsApi.save({
        date: drawerDate,
        weightKg:     metricForm.weightKg     ? parseFloat(metricForm.weightKg)     : undefined,
        caloriesKcal: metricForm.caloriesKcal ? parseInt(metricForm.caloriesKcal)   : undefined,
      });
      setMetric(data);
      setShowMetric(false);
      addToast('Health data saved!', 'success');
    } catch { addToast('Save failed', 'error'); }
    finally  { setMetricSaving(false); }
  };

  /* ── Render ── */
  const cells = buildCells();
  const ws    = weekSummary();
  const drawerDateObj = drawerDate ? parseDateStr(drawerDate) : null;
  const todayStr = toDateStr(today);

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:16, height:'100%' }}>

      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button className="icon-btn" onClick={prevMonth} aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 style={{ fontSize:26, minWidth:220, textAlign:'center' }}>
            {MONTH_NAMES[month]} {year}
          </h2>
          <button className="icon-btn" onClick={nextMonth} aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <button className="btn btn-outline btn-sm" onClick={goToday}>Today</button>
      </div>

      {/* Weekly summary */}
      <div style={{
        display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
        background:'var(--bg-2)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'12px 18px',
      }}>
        <div style={{ flex:1, minWidth:140 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:2 }}>
            This Week · {ws.start} – {ws.end}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'var(--accent)' }}>
            {ws.activeDays} <span style={{ fontSize:13, fontWeight:500, color:'var(--text-2)' }}>active days</span>
          </div>
        </div>
        {[
          { label:'Total',    value: ws.total,    unit:'exercises' },
          { label:'Strength', value: ws.strength, unit:'sessions'  },
          { label:'Cardio',   value: ws.cardio,   unit:'sessions'  },
        ].map(s => (
          <div key={s.label} className="stat-chip">
            <div className="stat-chip__label">{s.label}</div>
            <div className="stat-chip__value">{s.value} <span className="stat-chip__unit">{s.unit}</span></div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {calLoading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner size={32} /></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, flex:1 }}>
          {/* Day headers */}
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ textAlign:'center', padding:'4px 0 10px', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-3)' }}>
              {d}
            </div>
          ))}

          {/* Day cells */}
          {cells.map(({ date, other }, idx) => {
            const ds       = toDateStr(date);
            const exs      = calData[ds] || [];
            const closure  = closures[ds];
            const isToday  = ds === todayStr;
            const hasEx    = exs.length > 0;
            const catColor = hasEx ? (CAT_COLOUR[exs[0].category] || 'var(--border-light)') : null;

            return (
              <div
                key={idx}
                onClick={() => !other && openDrawer(ds)}
                style={{
                  background: other ? 'transparent' : (isToday ? 'var(--bg-3)' : 'var(--bg-2)'),
                  border: `1px solid ${isToday ? 'var(--accent)' : (other ? 'transparent' : 'var(--border)')}`,
                  boxShadow: isToday ? '0 0 0 1px var(--accent)' : 'none',
                  borderRadius:'var(--radius-sm)',
                  minHeight: 80,
                  padding: '6px 7px',
                  cursor: other ? 'default' : 'pointer',
                  opacity: other ? 0.3 : 1,
                  position:'relative',
                  overflow:'hidden',
                  transition:'border-color 0.15s, background 0.15s, transform 0.1s',
                }}
                onMouseEnter={e => !other && (e.currentTarget.style.transform='translateY(-1px)')}
                onMouseLeave={e => e.currentTarget.style.transform=''}
              >
                {/* Category stripe */}
                {catColor && (
                  <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:catColor, borderRadius:'4px 0 0 4px' }} />
                )}

                {/* Day number */}
                <span style={{
                  fontFamily:'var(--font-display)', fontSize:14, fontWeight:700,
                  color: isToday ? 'var(--bg)' : (other ? 'var(--text-3)' : 'var(--text-2)'),
                  background: isToday ? 'var(--accent)' : 'transparent',
                  borderRadius:4, padding: isToday ? '1px 5px' : 0,
                  display:'inline-block', marginBottom:4, marginLeft: catColor ? 6 : 0,
                }}>
                  {date.getDate()}
                </span>

                {/* Gym closure badge */}
                {closure && !other && (
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--red)', background:'var(--red-bg)', borderRadius:3, padding:'2px 5px', marginBottom:3 }}>
                    🔒 {closure.title}
                  </div>
                )}

                {/* Exercise pills */}
                {!other && exs.slice(0, 3).map((ex, i) => (
                  <div key={i} style={{ fontSize:10, fontWeight:500, color:'var(--text-2)', background:'var(--bg-4)', borderRadius:3, padding:'2px 5px', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {ex.name}
                  </div>
                ))}
                {!other && exs.length > 3 && (
                  <div style={{ fontSize:9, color:'var(--text-3)' }}>+{exs.length-3} more</div>
                )}

                {/* Rest label for empty non-closure days */}
                {!other && !hasEx && !closure && (
                  <div style={{ fontSize:9, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-3)', opacity:0.6, marginTop:4 }}>
                    Rest
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ DAY DRAWER ══ */}
      {/* Overlay */}
      <div
        className={`overlay ${drawerDate ? 'visible' : ''}`}
        onClick={closeDrawer}
        style={{ zIndex:300 }}
      />

      {/* Drawer panel */}
      <aside style={{
        position:'fixed', top:0, right:0, bottom:0,
        width: 420, maxWidth:'100vw',
        background:'var(--bg-2)', borderLeft:'1px solid var(--border)',
        zIndex:400, display:'flex', flexDirection:'column',
        transform: drawerDate ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.35s var(--ease-out)',
        overflow:'hidden',
      }}>
        {/* Drawer header */}
        <div style={{ padding:'22px 22px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:2 }}>
                {drawerDateObj ? DAY_NAMES[drawerDateObj.getDay()] : ''}
              </div>
              <h3 style={{ fontSize:20 }}>
                {drawerDateObj ? `${drawerDateObj.getDate()} ${MONTH_NAMES[drawerDateObj.getMonth()]} ${drawerDateObj.getFullYear()}` : ''}
              </h3>
            </div>
            <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Health metric bar */}
          {metric && (
            <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
              {metric.weightKg     && <span className="tag tag-blue"  style={{ fontSize:11 }}>⚖ {metric.weightKg} kg</span>}
              {metric.caloriesKcal && <span className="tag tag-green" style={{ fontSize:11 }}>🔥 {metric.caloriesKcal} kcal</span>}
              <button className="btn btn-ghost btn-sm" style={{ padding:'2px 8px', fontSize:11 }} onClick={() => setShowMetric(true)}>Edit</button>
            </div>
          )}
        </div>

        {/* Drawer body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 22px 28px', display:'flex', flexDirection:'column', gap:10 }}>
          {drawerLoading ? (
            <div style={{ display:'flex', justifyContent:'center', paddingTop:40 }}><Spinner /></div>
          ) : (
            <>
              {/* Gym closure notice */}
              {drawerDate && closures[drawerDate] && (
                <div style={{ background:'var(--red-bg)', border:'1px solid rgba(255,77,77,0.2)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
                  <div style={{ fontWeight:700, color:'var(--red)', fontSize:13 }}>🔒 {closures[drawerDate].title}</div>
                  <div style={{ color:'var(--text-2)', fontSize:12, marginTop:2 }}>{closures[drawerDate].reason}</div>
                </div>
              )}

              {/* Exercise list */}
              {drawerExercises.length === 0 ? (
                <p style={{ color:'var(--text-3)', fontSize:13, fontStyle:'italic', padding:'12px 0' }}>
                  No exercises — rest day or add one below.
                </p>
              ) : drawerExercises.map(ex => (
                <div key={ex._id} style={{
                  background:'var(--bg-3)', border:'1px solid var(--border)',
                  borderRadius:'var(--radius-sm)', padding:'12px 14px',
                  display:'flex', alignItems:'flex-start', gap:10,
                  animation:'slideUp 0.2s ease',
                }}>
                  <div style={{ width:3, alignSelf:'stretch', borderRadius:2, background: CAT_COLOUR[ex.category]||'var(--text-3)', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>
                      {ex.name}
                      {ex.isProgressive && <span style={{ marginLeft:6, fontSize:9, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 5px', borderRadius:3, background:'rgba(77,255,154,0.1)', color:'var(--green)' }}>↑ PO</span>}
                    </div>
                    <div style={{ color:'var(--text-2)', fontSize:12, marginTop:3, display:'flex', flexWrap:'wrap', gap:'4px 12px' }}>
                      {ex.type === 'strength' ? (
                        <><span>⚖ {ex.weight??0} kg</span><span>🔁 {ex.sets} sets</span><span>✕ {ex.reps} reps</span></>
                      ) : (
                        <span>⏱ {ex.duration} {ex.durationUnit}</span>
                      )}
                      <span style={{ color:'var(--text-3)', fontSize:11 }}>{ex.category}</span>
                    </div>
                    {ex.notes && <div style={{ marginTop:5, fontSize:12, color:'var(--text-3)', fontStyle:'italic' }}>{ex.notes}</div>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="icon-btn" title="Edit" onClick={() => openEdit(ex)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(ex._id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Inline add form */}
              {showAddForm && (
                <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, animation:'slideUp 0.2s ease' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:12 }}>
                    Add Exercise
                  </div>
                  <ExerciseForm
                    values={addForm}
                    onChange={(f,v) => setAddForm(prev => ({...prev,[f]:v}))}
                    type={addType}
                    onTypeChange={setAddType}
                  />
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={addSaving}>
                      {addSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!showAddForm && (
                <button className="btn btn-outline btn-full" onClick={() => setShowAddForm(true)}>
                  + Add Exercise
                </button>
              )}

              {!showMetric && (
                <button className="btn btn-ghost btn-full btn-sm" onClick={() => setShowMetric(true)}>
                  {metric ? '✏ Edit Weight / Calories' : '+ Log Weight / Calories'}
                </button>
              )}

              {/* Health metric form */}
              {showMetric && (
                <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, animation:'slideUp 0.2s ease' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:12 }}>
                    Health Metrics
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                    <div className="form-group">
                      <label className="label">Weight (kg)</label>
                      <input className="input" type="number" min="20" max="500" step="0.1" placeholder="e.g. 75.5"
                        value={metricForm.weightKg}
                        onChange={e => setMetricForm(p=>({...p,weightKg:e.target.value}))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Calories (kcal)</label>
                      <input className="input" type="number" min="0" placeholder="e.g. 2200"
                        value={metricForm.caloriesKcal}
                        onChange={e => setMetricForm(p=>({...p,caloriesKcal:e.target.value}))}
                      />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowMetric(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleMetricSave} disabled={metricSaving}>
                      {metricSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Edit modal */}
      {editEx && (
        <Modal
          title="Edit Exercise"
          onClose={() => setEditEx(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditEx(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          <ExerciseForm
            values={editForm}
            onChange={(f,v) => setEditForm(prev => ({...prev,[f]:v}))}
            type={editType}
            onTypeChange={setEditType}
          />
        </Modal>
      )}
    </div>
  );
}
