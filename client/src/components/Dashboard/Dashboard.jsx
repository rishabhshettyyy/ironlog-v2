/* ══════════════════════════════════════════════
   Dashboard/Dashboard.jsx
   Home view: today's plan, week summary, streak
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { exerciseApi, metricsApi } from '../../services/api';
import Spinner from '../UI/Spinner';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Dashboard({ onDayClick }) {
  const { user } = useAuth();
  const [todayExercises, setTodayExercises] = useState([]);
  const [weekStats,      setWeekStats]      = useState(null);
  const [streak,         setStreak]         = useState(0);
  const [todayMetric,    setTodayMetric]    = useState(null);
  const [loading,        setLoading]        = useState(true);

  const today    = new Date();
  const todayStr = toDateStr(today);

  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        /* Today's exercises */
        const { data: todayEx } = await exerciseApi.getByDate(todayStr);
        setTodayExercises(todayEx);

        /* Current week summary */
        const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const monday    = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const { data: weekEx } = await exerciseApi.getAll({
          month: toDateStr(monday).slice(0, 7),
        });

        /* Filter to this week only */
        const mondayStr = toDateStr(monday);
        const sundayStr = toDateStr(sunday);
        const thisWeek  = weekEx.filter(e => e.date >= mondayStr && e.date <= sundayStr);
        const activeDays = new Set(thisWeek.map(e => e.date)).size;
        setWeekStats({
          total:    thisWeek.length,
          strength: thisWeek.filter(e => e.type === 'strength').length,
          cardio:   thisWeek.filter(e => e.type === 'cardio').length,
          activeDays,
        });

        /* Streak — count consecutive past days with exercises */
        const { data: allEx } = await exerciseApi.getAll({});
        const datesWithEx = new Set(allEx.map(e => e.date));
        let s = 0;
        const check = new Date(today);
        // Start from yesterday since today may not be done yet
        check.setDate(check.getDate() - 1);
        while (datesWithEx.has(toDateStr(check))) {
          s++;
          check.setDate(check.getDate() - 1);
        }
        if (datesWithEx.has(todayStr)) s++; // count today if logged
        setStreak(s);

        /* Today's health metric */
        try {
          const { data: metric } = await metricsApi.getByDate(todayStr);
          setTodayMetric(metric);
        } catch { setTodayMetric(null); }

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Greeting */}
      <div>
        <h2 style={{ fontSize:28, marginBottom:4 }}>
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color:'var(--text-3)', fontSize:13 }}>
          {DAYS[today.getDay()]} · {today.getDate()} {MONTHS[today.getMonth()]} {today.getFullYear()}
        </p>
      </div>

      {/* Top stat row */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <StatCard label="Streak" value={streak} unit={streak === 1 ? 'day' : 'days'} accent />
        {weekStats && <>
          <StatCard label="This Week" value={weekStats.activeDays} unit="active days" />
          <StatCard label="Strength" value={weekStats.strength} unit="sessions" />
          <StatCard label="Cardio"   value={weekStats.cardio}   unit="sessions" />
        </>}
        {todayMetric?.weightKg && (
          <StatCard label="Weight" value={todayMetric.weightKg} unit="kg" />
        )}
      </div>

      {/* Today's workout */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h3 style={{ fontSize:16 }}>Today's Workout</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onDayClick(todayStr)}
          >
            {todayExercises.length > 0 ? 'View / Edit' : '+ Add Exercises'}
          </button>
        </div>

        {todayExercises.length === 0 ? (
          <p className="empty-state" style={{ padding:'20px 0' }}>
            No exercises logged today — rest day or click to add.
          </p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {todayExercises.map(ex => (
              <div key={ex._id} style={{
                display:'flex', alignItems:'center', gap:12,
                background:'var(--bg-3)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)', padding:'10px 14px',
              }}>
                <div style={{
                  width:3, alignSelf:'stretch', borderRadius:2,
                  background: ex.type === 'cardio' ? 'var(--green)' : 'var(--blue)',
                  flexShrink:0,
                }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{ex.name}</div>
                  <div style={{ color:'var(--text-3)', fontSize:12, marginTop:2 }}>
                    {ex.type === 'strength'
                      ? `${ex.weight ?? 0}kg · ${ex.sets}×${ex.reps}`
                      : `${ex.duration} ${ex.durationUnit}`}
                    {' · '}{ex.category}
                  </div>
                </div>
                {ex.isProgressive && (
                  <span style={{
                    fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                    padding:'2px 5px', borderRadius:3,
                    background:'rgba(77,255,154,0.1)', color:'var(--green)',
                  }}>↑ PO</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-bg)' : 'var(--bg-2)',
      border: `1px solid ${accent ? 'rgba(232,255,71,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '12px 18px',
      minWidth: 100,
    }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:4 }}>
        {label}
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}
        <span style={{ fontSize:12, fontWeight:500, color:'var(--text-2)', marginLeft:4 }}>{unit}</span>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
