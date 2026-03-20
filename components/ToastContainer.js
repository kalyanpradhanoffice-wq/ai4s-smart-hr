'use client';
import { useApp } from '@/lib/AppContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function ToastContainer() {
    const { toasts, removeToast } = useApp();

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === 'loading' ? (
                            <div className="toast-spinner" style={{ color: 'var(--brand-warning)' }}></div>
                        ) : toast.icon ? (
                            <span>{toast.icon}</span>
                        ) : toast.type === 'success' ? (
                            <CheckCircle size={20} color="#10b981" />
                        ) : toast.type === 'error' ? (
                            <AlertCircle size={20} color="#ef4444" />
                        ) : toast.type === 'warning' ? (
                            <AlertTriangle size={20} color="#f59e0b" />
                        ) : (
                            <Info size={20} color="#06b6d4" />
                        )}
                    </div>
                    <div className="toast-content">
                        <div className="toast-message">{toast.message}</div>
                    </div>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
