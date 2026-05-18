/* ══════════════════════════════════════════════
   UI/ExerciseForm.jsx
   Reusable strength / cardio exercise form.
   Type is selected via a dropdown instead of
   a side-by-side toggle to avoid overflow in
   narrow columns (e.g. the Routine page).
   Author: Rishabh
══════════════════════════════════════════════ */
import React from 'react';

const CATEGORIES = [
  'Upper Body','Lower Body','Core','Arms',
  'Back','Shoulders','Cardio','Active Rest','Full Body',
];

export default function ExerciseForm({ values, onChange, type, onTypeChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Name */}
      <div className="form-group">
        <label className="label">Exercise Name</label>
        <input
          className="input"
          placeholder="e.g. Bench Press"
          value={values.name || ''}
          onChange={e => onChange('name', e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="label">Category</label>
        <select
          className="select"
          value={values.category || ''}
          onChange={e => onChange('category', e.target.value)}
        >
          <option value="">— select —</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Type — dropdown instead of toggle to avoid overflow */}
      <div className="form-group">
        <label className="label">Type</label>
        <select
          className="select"
          value={type}
          onChange={e => onTypeChange(e.target.value)}
        >
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
        </select>
      </div>

      {/* Strength fields */}
      {type === 'strength' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div className="form-group">
            <label className="label">Weight (kg)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              style={{ width:'100%' }}
              value={values.weight ?? ''}
              onChange={e => onChange('weight', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Sets</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="3"
              style={{ width:'100%' }}
              value={values.sets ?? ''}
              onChange={e => onChange('sets', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Reps</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="10"
              style={{ width:'100%' }}
              value={values.reps ?? ''}
              onChange={e => onChange('reps', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Cardio fields */}
      {type === 'cardio' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div className="form-group">
            <label className="label">Duration</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="30"
              style={{ width:'100%' }}
              value={values.duration ?? ''}
              onChange={e => onChange('duration', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Unit</label>
            <select
              className="select"
              value={values.durationUnit || 'minutes'}
              onChange={e => onChange('durationUnit', e.target.value)}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="form-group">
        <label className="label">
          Notes{' '}
          <span style={{
            textTransform:'none', letterSpacing:0,
            fontWeight:400, fontSize:11, color:'var(--text-3)',
          }}>
            (optional)
          </span>
        </label>
        <textarea
          className="input"
          rows="2"
          placeholder="Any cues or observations…"
          value={values.notes || ''}
          onChange={e => onChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
