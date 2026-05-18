/* ══════════════════════════════════════════════
   pages/RoutinePage.jsx
   Weekly routine template editor:
     - Add / edit / delete exercises per day
     - Fill 6-month schedule with progressive overload
     - Clear a weekday or the entire calendar
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback } from 'react';
import { routineApi, exerciseApi } from '../services/api';
import ExerciseForm from '../components/UI/ExerciseForm';
import Modal from '../components/UI/Modal';
import Spinner from '../components/UI/Spinner';

const WEEK_DAYS   = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const WEEK_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const EMPTY_FORM = { name:'', category:'', weight:'', sets:'', reps:'', duration:'', durationUnit:'minutes', notes:'' };

export default function RoutinePage({ addToast }) {
  const [routine,  setRoutine]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  /* Add form state per day */
  const [addDay,  setAddDay]  = useState(null); // which day's form is open
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addType, setAddType] = useState('strength');
  const [addSaving,setAddSaving]=useState(false);

  /* Edit modal */
  const [editModal, setEditModal] = useState(null); // { day, index, ex }
  const [editForm,  setEditForm]  = useState(EMPTY_FORM);
  const [editType,  setEditType]  = useState('strength');
  const [editSaving,setEditSaving]=useState(false);

  /* Fill / clear state */
  const [filling,  setFilling]  = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchRoutine = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await routineApi.get();
      setRoutine(data);
    } catch { addToast('Failed to load routine', 'error'); }
    finally  { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchRoutine(); }, [fetchRoutine]);

  /* ── Save routine to backend ── */
  const persist = async (updated) => {
    setRoutine(updated);
    try {
      await routineApi.save(updated);
    } catch { addToast('Failed to save routine', 'error'); }
  };

  /* ── Add exercise to a day ── */
  const showAdd = (day) => {
    setAddDay(day);
    setAddForm(EMPTY_FORM);
    setAddType('strength');
  };
  const hideAdd = () => setAddDay(null);

  const handleAdd = async () => {
    if (!addForm.name?.trim()) { addToast('Name required', 'error'); return; }
    if (!addForm.category)     { addToast('Category required', 'error'); return; }
    if (addType === 'strength' && (!addForm.sets || !addForm.reps)) { addToast('Sets and reps required', 'error'); return; }
    if (addType === 'cardio' && !addForm.duration) { addToast('Duration required', 'error'); return; }

    const ex = {
      name: addForm.name.trim(), category: addForm.category, type: addType,
      weight:       addType === 'strength' ? parseFloat(addForm.weight)||0    : 0,
      sets:         addType === 'strength' ? parseInt(addForm.sets)||null      : null,
      reps:         addType === 'strength' ? parseInt(addForm.reps)||null      : null,
      duration:     addType === 'cardio'   ? parseFloat(addForm.duration)||null: null,
      durationUnit: addType === 'cardio'   ? addForm.durationUnit              : 'minutes',
      notes: addForm.notes?.trim() || null,
    };

    setAddSaving(true);
    const updated = { ...routine, [addDay]: [...(routine[addDay]||[]), ex] };
    await persist(updated);
    setAddSaving(false);
    hideAdd();
    addToast(`Added "${ex.name}" to ${addDay.charAt(0).toUpperCase()+addDay.slice(1)}!`, 'success');
  };

  /* ── Edit exercise in a day ── */
  const openEdit = (day, index) => {
    const ex = routine[day][index];
    setEditModal({ day, index, ex });
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
    const updated = { ...routine };
    updated[editModal.day] = [...updated[editModal.day]];
    updated[editModal.day][editModal.index] = {
      name: editForm.name.trim(), category: editForm.category, type: editType,
      weight:       editType === 'strength' ? parseFloat(editForm.weight)||0     : 0,
      sets:         editType === 'strength' ? parseInt(editForm.sets)||null       : null,
      reps:         editType === 'strength' ? parseInt(editForm.reps)||null       : null,
      duration:     editType === 'cardio'   ? parseFloat(editForm.duration)||null : null,
      durationUnit: editType === 'cardio'   ? editForm.durationUnit               : 'minutes',
      notes: editForm.notes?.trim() || null,
    };
    await persist(updated);
    setEditSaving(false);
    setEditModal(null);
    addToast('Exercise updated!', 'success');
  };

  /* ── Delete exercise from a day ── */
  const handleDelete = async (day, index) => {
    const updated = { ...routine, [day]: routine[day].filter((_, i) => i !== index) };
    await persist(updated);
    addToast('Exercise removed.', 'success');
  };

  /* ── Fill 6-month schedule ── */
  const handleFill = async () => {
    const hasAny = WEEK_DAYS.some(d => routine[d]?.length > 0);
    if (!hasAny) { addToast('Add exercises to your routine first!', 'error'); return; }
    const activeDays = WEEK_DAYS.filter(d => routine[d]?.length > 0).length;
    if (!confirm(`Generate ~${activeDays * 26} sessions across 6 months?\n\n+5kg every 3 weeks on first strength exercise per day.\nExisting entries will NOT be overwritten.`)) return;
    setFilling(true);
    try {
      const { data } = await routineApi.fillSchedule();
      addToast(`✓ Added ${data.inserted} sessions across 6 months!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Fill failed', 'error');
    } finally { setFilling(false); }
  };

  /* ── Clear a weekday ── */
  const handleClearDay = async (day) => {
    const label = day.charAt(0).toUpperCase() + day.slice(1);
    if (!confirm(`Delete ALL exercises from every ${label} across the entire calendar?\n\nThis cannot be undone.`)) return;
    try {
      const { data } = await exerciseApi.clearAll(day);
      const updated = { ...routine, [day]: [] };
      await persist(updated);
      addToast(`${label} cleared — ${data.deleted} exercises removed.`, 'success');
    } catch { addToast('Clear failed', 'error'); }
  };

  /* ── Clear entire calendar ── */
  const handleClearAll = async () => {
    if (!confirm('WARNING: Delete EVERY exercise across the entire calendar?\n\nYour routine template will NOT be affected.\n\nThis cannot be undone.')) return;
    if (!confirm('Last chance — permanently delete everything?')) return;
    setClearing(true);
    try {
      const { data } = await exerciseApi.clearAll();
      addToast(`Calendar cleared — ${data.deleted} exercises deleted.`, 'success');
    } catch { addToast('Clear failed', 'error'); }
    finally  { setClearing(false); }
  };

  if (loading) {
    return <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size={32} /></div>;
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:28 }}>Weekly Routine</h2>
          <p style={{ color:'var(--text-3)', fontSize:13, marginTop:4 }}>
            Define your 7-day split. Use "Fill Schedule" to auto-populate 6 months with progressive overload.
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleClearAll} disabled={clearing}>
            {clearing ? 'Clearing…' : '🗑 Clear Entire Calendar'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleFill} disabled={filling}>
            {filling ? '⏳ Filling…' : '↻ Fill 6-Month Schedule'}
          </button>
        </div>
      </div>

      {/* 7-column routine grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10 }}>
        {WEEK_DAYS.map((day, i) => {
          const exercises = routine?.[day] || [];
          return (
            <div key={day} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

              {/* Day header */}
              <div style={{ padding:'8px 12px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-2)', textAlign:'center' }}>
                {WEEK_LABELS[i].slice(0,3)}
              </div>

              {/* Exercise list */}
              <div style={{ padding:8, flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                {exercises.length === 0 ? (
                  <p style={{ fontSize:11, color:'var(--text-3)', fontStyle:'italic', textAlign:'center', padding:'8px 0' }}>Rest day</p>
                ) : exercises.map((ex, idx) => (
                  <div key={idx} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'6px 8px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:4 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ex.name}</div>
                      <div style={{ fontSize:10, color:'var(--text-3)', marginTop:1 }}>
                        {ex.type === 'strength' ? `${ex.weight??0}kg · ${ex.sets}×${ex.reps}` : `${ex.duration} ${ex.durationUnit}`}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:1, flexShrink:0 }}>
                      <button className="icon-btn" style={{ padding:2 }} title="Edit" onClick={() => openEdit(day, idx)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="icon-btn danger" style={{ padding:2 }} title="Remove" onClick={() => handleDelete(day, idx)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ padding:'0 8px 8px', display:'flex', flexDirection:'column', gap:4 }}>
                {addDay === day ? (
                  <div style={{ background:'var(--bg-3)', border:'1px solid var(--accent)', borderRadius:'var(--radius-sm)', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                    <ExerciseForm
                      values={addForm}
                      onChange={(f,v) => setAddForm(p=>({...p,[f]:v}))}
                      type={addType}
                      onTypeChange={setAddType}
                    />
                    <div style={{ display:'flex', justifyContent:'flex-end', width:'100%', marginTop:4 }}>
                      <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={addSaving}>
    {addSaving ? '…' : 'Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-outline btn-full btn-sm" onClick={() => showAdd(day)}>+ Add</button>
                )}
                <button className="btn btn-danger btn-full btn-sm" onClick={() => handleClearDay(day)}>
                  🗑 Clear {WEEK_LABELS[i].slice(0,3)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editModal && (
        <Modal
          title={`Edit Exercise — ${editModal.day.charAt(0).toUpperCase()+editModal.day.slice(1)}`}
          onClose={() => setEditModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          <ExerciseForm
            values={editForm}
            onChange={(f,v) => setEditForm(p=>({...p,[f]:v}))}
            type={editType}
            onTypeChange={setEditType}
          />
        </Modal>
      )}
    </div>
  );
}
