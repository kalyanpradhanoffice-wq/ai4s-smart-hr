'use client';
import { Cake, Heart } from 'lucide-react';

export default function BirthdayTile({ users }) {
    const upcomingBirthdays = users.filter(u => u.dob).map(u => {
        const dob = new Date(u.dob);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
        const diff = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
        return { ...u, daysUntil: diff };
    }).filter(u => u.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Upcoming Birthdays</h3>
                <Cake size={18} color="var(--brand-primary-light)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingBirthdays.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No birthdays in the next 30 days.
                    </div>
                ) : (
                    upcomingBirthdays.map(ub => (
                        <div key={ub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="avatar avatar-sm">{ub.avatar}</div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ub.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(ub.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 8px', borderRadius: 12, background: ub.daysUntil === 0 ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.08)', color: ub.daysUntil === 0 ? '#f43f5e' : 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {ub.daysUntil === 0 && <Heart size={10} fill="#f43f5e" />}
                                {ub.daysUntil === 0 ? 'Today! 🎉' : `${ub.daysUntil} days to go`}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
