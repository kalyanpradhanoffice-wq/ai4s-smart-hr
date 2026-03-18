'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { Target, Plus, TrendingUp, CheckCircle, Clock, Edit3, ChevronDown, ChevronUp } from 'lucide-react';

function OKRContent() {
    const { currentUser, okrs, updateOKRProgress } = useApp();
    const [expanded, setExpanded] = useState({});

    const myOKRs = okrs.filter(o => o.userId === currentUser?.id);

    function toggleExpand(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }

    function getStatusColor(pct) {
        if (pct >= 80) return '#10b981';
        if (pct >= 50) return '#f59e0b';
        return '#ef4444';
    }

    function getStatusLabel(pct) {
        if (pct >= 80) return 'On Track';
        if (pct >= 50) return 'At Risk';
        return 'Behind';
    }

    // Ring component using SVG
    function Ring({ pct, size = 80, strokeWidth = 8 }) {
        const r = (size - strokeWidth) / 2;
        const circ = 2 * Math.PI * r;
        const offset = circ - (pct / 100) * circ;
        const color = getStatusColor(pct);
        return (
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ transform: 'rotate(90deg) translate(0, 0)', transformOrigin: 'center', fill: color, fontSize: size * 0.2, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                    <tspan style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>{pct}%</tspan>
                </text>
            </svg>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">OKR Dashboard</h1>
                    <p className="page-subtitle">Objectives & Key Results — Q1 2025</p>
                </div>
                <button className="btn btn-primary"><Plus size={16} /> New Objective</button>
            </div>

            {myOKRs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <Target size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No OKRs set yet. Create your first objective to get started.</p>
                </div>
            ) : (
                myOKRs.map(okr => (
                    <div key={okr.id} className="card" style={{ marginBottom: 20 }}>
                        {/* Objective Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                            {/* Progress Ring */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx={45} cy={45} r={36} fill="none" stroke="var(--bg-elevated)" strokeWidth={8} />
                                    <circle cx={45} cy={45} r={36} fill="none" stroke={getStatusColor(okr.overallProgress)} strokeWidth={8}
                                        strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 - (okr.overallProgress / 100) * 2 * Math.PI * 36}
                                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: getStatusColor(okr.overallProgress) }}>{okr.overallProgress}%</div>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{okr.objective}</h3>
                                    <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, background: `${getStatusColor(okr.overallProgress)}18`, color: getStatusColor(okr.overallProgress), border: `1px solid ${getStatusColor(okr.overallProgress)}30` }}>
                                        {getStatusLabel(okr.overallProgress)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{okr.keyResults.length} Key Results • {okr.quarter}</div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleExpand(okr.id)}>
                                {expanded[okr.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>

                        {/* Key Results */}
                        {(expanded[okr.id] !== false) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {okr.keyResults.map(kr => {
                                    const pct = Math.round((kr.current / kr.target) * 100);
                                    const color = getStatusColor(pct);
                                    return (
                                        <div key={kr.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{kr.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                        {kr.current} / {kr.target} {kr.unit}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1rem', color }}>
                                                        {pct}%
                                                    </div>
                                                    <input type="range" min={0} max={kr.target} value={kr.current}
                                                        onChange={e => updateOKRProgress(okr.id, kr.id, Number(e.target.value))}
                                                        style={{ width: 80, accentColor: color }} />
                                                </div>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: color || 'var(--gradient-brand)' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default function OKRPage() {
    return <DashboardLayout title="OKR Dashboard"><OKRContent /></DashboardLayout>;
}
