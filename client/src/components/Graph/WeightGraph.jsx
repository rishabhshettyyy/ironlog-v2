/* ══════════════════════════════════════════════
   Graph/WeightGraph.jsx
   Animated SVG line graph for weight / BMI over
   time. Draws the line with a CSS stroke animation
   so it grows on screen from left to right.
   Props:
     metrics  — array of { date, weightKg }
     heightCm — user's height (for BMI mode)
     onClose  — closes the panel
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { useState, useMemo, useRef, useEffect } from 'react';

const W = 560;  // viewBox width
const H = 260;  // viewBox height
const PAD = { top:20, right:20, bottom:40, left:50 };

export default function WeightGraph({ metrics, heightCm, onClose }) {
  const [mode, setMode] = useState('weight'); // 'weight' | 'bmi'
  const pathRef = useRef(null);

  /* Compute data points */
  const points = useMemo(() => {
    return metrics
      .filter(m => m.weightKg != null)
      .map(m => {
        const value = mode === 'bmi' && heightCm
          ? parseFloat((m.weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))
          : m.weightKg;
        return { date: m.date, value };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics, mode, heightCm]);

  /* Scale helpers */
  const { svgPoints, minV, maxV } = useMemo(() => {
    if (points.length < 2) return { svgPoints: [], minV: 0, maxV: 0 };

    const values  = points.map(p => p.value);
    const minV    = Math.min(...values) - 2;
    const maxV    = Math.max(...values) + 2;
    const innerW  = W - PAD.left - PAD.right;
    const innerH  = H - PAD.top  - PAD.bottom;

    const svgPoints = points.map((p, i) => ({
      x: PAD.left + (i / (points.length - 1)) * innerW,
      y: PAD.top  + (1 - (p.value - minV) / (maxV - minV)) * innerH,
      date:  p.date,
      value: p.value,
    }));

    return { svgPoints, minV, maxV };
  }, [points]);

  /* Build SVG path string */
  const pathD = useMemo(() => {
    if (svgPoints.length < 2) return '';
    return svgPoints.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth bezier
      const prev = svgPoints[i - 1];
      const cpX  = (prev.x + p.x) / 2;
      return `${acc} C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
    }, '');
  }, [svgPoints]);

  /* Animate line draw on mount / mode change */
  useEffect(() => {
    const el = pathRef.current;
    if (!el || !pathD) return;
    const len = el.getTotalLength?.() || 1000;
    el.style.strokeDasharray  = len;
    el.style.strokeDashoffset = len;
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
        el.style.strokeDashoffset = '0';
      });
    });
  }, [pathD, mode]);

  /* Hover state */
  const [hovered, setHovered] = useState(null);

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]}`;
  };

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.7)', backdropFilter:'blur(3px)',
      zIndex:500, display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, animation:'fadeIn 0.2s ease',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:'var(--bg-2)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', width:'100%', maxWidth:640,
        animation:'slideUp 0.25s var(--ease-out)',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 0' }}>
          <h3 style={{ fontSize:18 }}>Weight Trends</h3>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Mode toggle */}
            <div className="toggle-group" style={{ width:'auto' }}>
              <button
                className={`toggle-btn ${mode === 'weight' ? 'active' : ''}`}
                onClick={() => setMode('weight')}
              >Weight</button>
              <button
                className={`toggle-btn ${mode === 'bmi' ? 'active' : ''}`}
                onClick={() => setMode('bmi')}
                disabled={!heightCm}
                title={!heightCm ? 'Add your height in Profile to enable BMI view' : ''}
              >BMI</button>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ padding:20 }}>
          {points.length < 2 ? (
            <p className="empty-state">
              Log your weight on at least 2 different days to see the trend graph.
            </p>
          ) : (
            <>
              {/* SVG Graph */}
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width:'100%', overflow:'visible' }}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Y-axis gridlines */}
                {[0,0.25,0.5,0.75,1].map(t => {
                  const y = PAD.top + t * (H - PAD.top - PAD.bottom);
                  const v = (maxV - (maxV - minV) * t).toFixed(1);
                  return (
                    <g key={t}>
                      <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                        stroke="var(--border)" strokeWidth="1" />
                      <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                        fill="var(--text-3)" fontSize="10">{v}</text>
                    </g>
                  );
                })}

                {/* X-axis date labels */}
                {svgPoints.filter((_, i) =>
                  i === 0 || i === svgPoints.length - 1 ||
                  (svgPoints.length > 4 && i % Math.ceil(svgPoints.length / 4) === 0)
                ).map((p, i) => (
                  <text key={i} x={p.x} y={H - 8} textAnchor="middle"
                    fill="var(--text-3)" fontSize="10">{formatDate(p.date)}</text>
                ))}

                {/* Gradient fill under line */}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {pathD && (
                  <path
                    d={`${pathD} L ${svgPoints[svgPoints.length-1].x} ${H - PAD.bottom} L ${svgPoints[0].x} ${H - PAD.bottom} Z`}
                    fill="url(#lineGrad)"
                  />
                )}

                {/* Animated line */}
                {pathD && (
                  <path
                    ref={pathRef}
                    d={pathD}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data point dots + hover */}
                {svgPoints.map((p, i) => (
                  <g key={i}
                    onMouseEnter={() => setHovered(p)}
                    style={{ cursor:'pointer' }}
                  >
                    <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                    <circle cx={p.x} cy={p.y} r={hovered === p ? 5 : 3}
                      fill="var(--accent)"
                      style={{ transition:'r 0.15s' }}
                    />
                  </g>
                ))}

                {/* Tooltip */}
                {hovered && (
                  <g>
                    <rect
                      x={Math.min(hovered.x - 40, W - PAD.right - 90)}
                      y={hovered.y - 40}
                      width={88} height={30}
                      rx={4}
                      fill="var(--bg-3)"
                      stroke="var(--border)"
                    />
                    <text
                      x={Math.min(hovered.x - 40, W - PAD.right - 90) + 44}
                      y={hovered.y - 20}
                      textAnchor="middle"
                      fill="var(--text)"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {hovered.value} {mode === 'bmi' ? '' : 'kg'}
                    </text>
                    <text
                      x={Math.min(hovered.x - 40, W - PAD.right - 90) + 44}
                      y={hovered.y - 8}
                      textAnchor="middle"
                      fill="var(--text-3)"
                      fontSize="10"
                    >
                      {formatDate(hovered.date)}
                    </text>
                  </g>
                )}
              </svg>

              {/* Legend */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:'var(--text-3)' }}>
                <span>{points.length} data points</span>
                {mode === 'bmi' && (
                  <span>BMI = weight / height²</span>
                )}
                <span>
                  Range: {Math.min(...points.map(p=>p.value))} – {Math.max(...points.map(p=>p.value))}
                  {mode === 'weight' ? ' kg' : ''}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
