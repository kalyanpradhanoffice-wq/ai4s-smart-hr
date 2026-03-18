'use client';

export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 20,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="spinner-container">
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    color: 'var(--brand-primary)',
                    letterSpacing: '0.1em'
                }}> AI </div>
            </div>
            <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }}>
                Loading Dashboard...
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .spinner-container {
                    position: relative;
                }
            `}</style>
        </div>
    );
}
