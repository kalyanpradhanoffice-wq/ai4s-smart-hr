'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { UserCheck, Plus, Calendar, Clock, Video, MapPin, Star, ThumbsUp, ThumbsDown, ChevronDown, Users } from 'lucide-react';

const POSITIONS = ['Software Engineer', 'Senior Software Engineer', 'Product Manager', 'HR Executive', 'Sales Executive', 'Finance Analyst', 'DevOps Engineer', 'UI/UX Designer'];

function InterviewContent() {
    const { currentUser, users, interviews, createInterview, updateInterviewAssessment } = useApp();
    const [activeTab, setActiveTab] = useState('list');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAssessModal, setShowAssessModal] = useState(null); // holds interview object
    const [form, setForm] = useState({
        candidateName: '', candidateEmail: '', candidatePhone: '', appliedPosition: '',
        interviewDate: '', interviewTime: '', interviewMode: 'offline',
        meetingLink: '', interviewerId: '', notes: ''
    });
    const [assessment, setAssessment] = useState({
        rating: 3, strengths: '', weaknesses: '', recommendation: 'hold'
    });

    function handleSchedule(e) {
        e.preventDefault();
        createInterview(form);
        setShowScheduleModal(false);
        setForm({ candidateName: '', candidateEmail: '', candidatePhone: '', appliedPosition: '', interviewDate: '', interviewTime: '', interviewMode: 'offline', meetingLink: '', interviewerId: '', notes: '' });
    }

    function handleAssessment(e) {
        e.preventDefault();
        if (showAssessModal) {
            updateInterviewAssessment(showAssessModal.id, assessment);
        }
        setShowAssessModal(null);
        setAssessment({ rating: 3, strengths: '', weaknesses: '', recommendation: 'hold' });
    }

    const scheduled = interviews.filter(i => i.status === 'scheduled');
    const completed = interviews.filter(i => i.status === 'completed');

    const recBadge = {
        hire: { color: '#10b981', label: 'Hire' },
        hold: { color: '#f59e0b', label: 'On Hold' },
        reject: { color: '#ef4444', label: 'Reject' },
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Interview Scheduling</h1>
                    <p className="page-subtitle">Schedule and manage candidate interviews</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
                    <Plus size={16} /> Schedule Interview
                </button>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Total Scheduled', value: scheduled.length, color: '#6366f1' },
                    { label: 'Completed', value: completed.length, color: '#10b981' },
                    { label: 'Hire Recommendations', value: completed.filter(i => i.assessment?.recommendation === 'hire').length, color: '#34d399' },
                    { label: 'Reject Recommendations', value: completed.filter(i => i.assessment?.recommendation === 'reject').length, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 24 }}>
                <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>Upcoming ({scheduled.length})</button>
                <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed ({completed.length})</button>
            </div>

            {/* Interview List */}
            {(activeTab === 'list' ? scheduled : completed).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    <UserCheck size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600 }}>No interviews {activeTab === 'list' ? 'scheduled' : 'completed'} yet</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 8 }}>Use the button above to schedule a new interview</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(activeTab === 'list' ? scheduled : completed).map(inv => {
                        const interviewer = users.find(u => u.id === inv.interviewerId);
                        const rec = inv.assessment?.recommendation;
                        return (
                            <div key={inv.id} className="card" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <div className="avatar avatar-sm" style={{ background: 'var(--gradient-brand)' }}>
                                                {inv.candidateName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{inv.candidateName}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.appliedPosition}</div>
                                            </div>
                                            {rec && <span style={{ marginLeft: 8, padding: '3px 10px', borderRadius: 20, background: `${recBadge[rec].color}15`, color: recBadge[rec].color, fontSize: '0.72rem', fontWeight: 700 }}>{recBadge[rec].label}</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{inv.interviewDate}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{inv.interviewTime}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {inv.interviewMode === 'online' ? <Video size={13} /> : <MapPin size={13} />}
                                                {inv.interviewMode === 'online' ? 'Online' : 'In-Person'}
                                            </span>
                                            {interviewer && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} />Interviewer: {interviewer.name}</span>}
                                        </div>
                                        {inv.interviewMode === 'online' && inv.meetingLink && (
                                            <a href={inv.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--brand-primary-light)', marginTop: 6, display: 'inline-block' }}>
                                                🔗 Join Meeting
                                            </a>
                                        )}
                                        {inv.assessment && (
                                            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={14} fill={i < inv.assessment.rating ? '#f59e0b' : 'none'} color={i < inv.assessment.rating ? '#f59e0b' : 'var(--text-muted)'} />
                                                    ))}
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>Rating: {inv.assessment.rating}/5</span>
                                                </div>
                                                {inv.assessment.strengths && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong>Strengths:</strong> {inv.assessment.strengths}</div>}
                                                {inv.assessment.weaknesses && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}><strong>Weaknesses:</strong> {inv.assessment.weaknesses}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                                        {inv.status === 'scheduled' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => { setShowAssessModal(inv); }}>
                                                <Star size={13} /> Submit Assessment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Schedule Interview Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowScheduleModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Schedule New Interview</h3>
                        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>Candidate Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Candidate Name *</label>
                                    <input className="form-input" placeholder="Full name" value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Applied Position *</label>
                                    <select className="form-select" value={form.appliedPosition} onChange={e => setForm(f => ({ ...f, appliedPosition: e.target.value }))} required>
                                        <option value="">Select position...</option>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" placeholder="candidate@email.com" value={form.candidateEmail} onChange={e => setForm(f => ({ ...f, candidateEmail: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.candidatePhone} onChange={e => setForm(f => ({ ...f, candidatePhone: e.target.value }))} />
                                </div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginTop: 4 }}>Interview Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Interview Date *</label>
                                    <input type="date" className="form-input" value={form.interviewDate} onChange={e => setForm(f => ({ ...f, interviewDate: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Interview Time *</label>
                                    <input type="time" className="form-input" value={form.interviewTime} onChange={e => setForm(f => ({ ...f, interviewTime: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Interview Mode *</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['offline', 'online'].map(mode => (
                                        <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${form.interviewMode === mode ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: form.interviewMode === mode ? 'rgba(99,102,241,0.08)' : 'transparent', flex: 1, justifyContent: 'center' }}>
                                            <input type="radio" hidden name="mode" value={mode} checked={form.interviewMode === mode} onChange={() => setForm(f => ({ ...f, interviewMode: mode }))} />
                                            {mode === 'online' ? <Video size={16} /> : <MapPin size={16} />}
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{mode === 'online' ? 'Online' : 'In-Person'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {form.interviewMode === 'online' && (
                                <div className="form-group">
                                    <label className="form-label">Meeting Link</label>
                                    <input className="form-input" placeholder="https://meet.google.com/... or teams link" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} />
                                </div>
                            )}

                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginTop: 4 }}>Panel Assignment</div>
                            <div className="form-group">
                                <label className="form-label">Assign Interviewer</label>
                                <select className="form-select" value={form.interviewerId} onChange={e => setForm(f => ({ ...f, interviewerId: e.target.value }))}>
                                    <option value="">Select interviewer...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-textarea" placeholder="Additional notes or instructions..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Calendar size={14} /> Schedule Interview</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assessment Modal */}
            {showAssessModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAssessModal(null)}>
                    <div className="modal-box" style={{ maxWidth: 500 }}>
                        <h3 style={{ marginBottom: 6, fontFamily: 'var(--font-display)' }}>Interview Assessment</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            Candidate: <strong style={{ color: 'var(--text-primary)' }}>{showAssessModal.candidateName}</strong> for <strong style={{ color: 'var(--text-primary)' }}>{showAssessModal.appliedPosition}</strong>
                        </div>
                        <form onSubmit={handleAssessment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Candidate Rating (1–5) *</label>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} type="button" onClick={() => setAssessment(a => ({ ...a, rating: n }))}
                                            style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', border: `2px solid ${assessment.rating >= n ? '#f59e0b' : 'var(--border-subtle)'}`, background: assessment.rating >= n ? 'rgba(245,158,11,0.12)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Star size={18} fill={assessment.rating >= n ? '#f59e0b' : 'none'} color={assessment.rating >= n ? '#f59e0b' : 'var(--text-muted)'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Strengths</label>
                                <textarea className="form-textarea" placeholder="Key strengths observed..." value={assessment.strengths} onChange={e => setAssessment(a => ({ ...a, strengths: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weaknesses / Areas of Improvement</label>
                                <textarea className="form-textarea" placeholder="Areas that need improvement..." value={assessment.weaknesses} onChange={e => setAssessment(a => ({ ...a, weaknesses: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Recommendation *</label>
                                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                    {[
                                        { value: 'hire', label: 'Hire', color: '#10b981', icon: ThumbsUp },
                                        { value: 'hold', label: 'On Hold', color: '#f59e0b', icon: ChevronDown },
                                        { value: 'reject', label: 'Reject', color: '#ef4444', icon: ThumbsDown },
                                    ].map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setAssessment(a => ({ ...a, recommendation: opt.value }))}
                                            style={{ flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${assessment.recommendation === opt.value ? opt.color : 'var(--border-subtle)'}`, background: assessment.recommendation === opt.value ? `${opt.color}12` : 'transparent', cursor: 'pointer', color: assessment.recommendation === opt.value ? opt.color : 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <opt.icon size={14} /> {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAssessModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Star size={14} /> Submit Assessment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function InterviewPage() {
    return <DashboardLayout title="Interview Scheduling"><InterviewContent /></DashboardLayout>;
}
