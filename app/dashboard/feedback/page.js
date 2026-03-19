'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { Star, Send, Eye, EyeOff, Award } from 'lucide-react';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/mockData';

const CATEGORIES = ['communication', 'leadership', 'technical', 'collaboration'];

function FeedbackContent() {
    const { currentUser, users, feedback, submitFeedback, customRoles } = useApp();
    const [activeTab, setActiveTab] = useState('give');
    const [reviewee, setReviewee] = useState('');
    const [ratings, setRatings] = useState({ communication: 0, leadership: 0, technical: 0, collaboration: 0 });
    const [comments, setComments] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_FEEDBACK, customRoles);
    const myReceivedFeedback = feedback.filter(f => f.revieweeId === currentUser?.id);
    const allFeedback = canViewAll ? feedback : myReceivedFeedback;

    function setRating(cat, val) {
        setRatings(r => ({ ...r, [cat]: val }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const fbData = {
            revieweeId: reviewee,
            reviewerId: currentUser.id,
            reviewerRole: currentUser.role,
            quarter: 'Q1 2025',
            ratings,
            comments,
            submittedOn: new Date().toISOString().split('T')[0],
            isAnonymous: false,
        };
        const success = await submitFeedback(fbData);
        if (success) {
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 2000);
            setReviewee('');
            setRatings({ communication: 0, leadership: 0, technical: 0, collaboration: 0 });
            setComments('');
        }
    }

    function StarRating({ cat, val, onChange }) {
        return (
            <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} type="button" onClick={() => onChange(cat, i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: i <= val ? '#f59e0b' : 'var(--border-default)', transition: 'color 0.1s' }}>
                        <Star size={22} fill={i <= val ? '#f59e0b' : 'none'} />
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="page-title">360° Feedback</h1><p className="page-subtitle">Multi-rater performance feedback system</p></div>
                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'give' ? 'active' : ''}`} onClick={() => setActiveTab('give')}>Give Feedback</button>
                    <button className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`} onClick={() => setActiveTab('receive')}>Received</button>
                    {canViewAll && <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Feedback (HR)</button>}
                </div>
            </div>

            {activeTab === 'give' && (
                <div style={{ maxWidth: 600 }}>
                    <div className="alert alert-info" style={{ marginBottom: 20 }}>
                        <EyeOff size={15} style={{ flexShrink: 0 }} /> Your feedback may be marked anonymous to the receiver but is visible to HR Admins for quality assurance.
                    </div>
                    {submitted ? (
                        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎉</div>
                            <h3 style={{ color: '#34d399' }}>Feedback Submitted!</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Thank you for your contribution to the team's growth.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div className="form-group">
                                    <label className="form-label">Who are you reviewing?</label>
                                    <select className="form-select" value={reviewee} onChange={e => setReviewee(e.target.value)} required>
                                        <option value="">Select colleague...</option>
                                        {users.filter(u => u.id !== currentUser?.id).map(u => <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>)}
                                    </select>
                                </div>
                                {CATEGORIES.map(cat => (
                                    <div key={cat} className="form-group">
                                        <label className="form-label" style={{ textTransform: 'capitalize' }}>{cat}</label>
                                        <StarRating cat={cat} val={ratings[cat]} onChange={setRating} />
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label className="form-label">Overall Comments</label>
                                    <textarea className="form-textarea" placeholder="Share specific observations and growth suggestions..." value={comments} onChange={e => setComments(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}><Send size={15} /> Submit Feedback</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {(activeTab === 'receive' || activeTab === 'all') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(activeTab === 'all' ? allFeedback : myReceivedFeedback).length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                            <Award size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                            <p style={{ color: 'var(--text-muted)' }}>No feedback received yet.</p>
                        </div>
                    ) : (
                        (activeTab === 'all' ? allFeedback : myReceivedFeedback).map(fb => {
                            const reviewer = users.find(u => u.id === fb.reviewerId);
                            const reviewee = users.find(u => u.id === fb.revieweeId);
                            const avgRating = (Object.values(fb.ratings).reduce((a, b) => a + b, 0) / Object.values(fb.ratings).length).toFixed(1);
                            return (
                                <div key={fb.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            {canViewAll && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>For: <strong style={{ color: 'var(--text-primary)' }}>{reviewee?.name}</strong></div>}
                                            {/* Anonymous to reviewee, visible to HR Admin */}
                                            {(canViewAll || fb.revieweeId === currentUser?.id) ? (
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    {canViewAll ? <>From: <strong>{reviewer?.name}</strong> ({fb.reviewerRole})</> : 'Anonymous Feedback'}
                                                </div>
                                            ) : null}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{fb.quarter} • {fb.submittedOn}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#f59e0b' }}>{avgRating}</div>
                                            <div style={{ display: 'flex', gap: 2 }}>
                                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= Math.round(avgRating) ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                                        {CATEGORIES.map(cat => (
                                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', fontSize: '0.8rem' }}>
                                                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{cat}</span>
                                                <div style={{ display: 'flex', gap: 2 }}>
                                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill={i <= fb.ratings[cat] ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '2px solid var(--border-default)', paddingLeft: 12 }}>"{fb.comments}"</p>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default function FeedbackPage() {
    return <DashboardLayout title="360° Feedback"><FeedbackContent /></DashboardLayout>;
}
