// src/components/Toast.jsx
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger:  XCircle,
  info:    Info,
};
const COLORS = {
  success: '#56D364',
  warning: '#E8B63A',
  danger:  '#FF7B7B',
  info:    '#79C0FF',
};

export default function Toast() {
  const { state, dispatch } = useApp();
  const { toasts } = state;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Icon size={16} color={COLORS[toast.type]} />
            <span style={{ flex: 1, fontSize: 12 }}>{toast.message}</span>
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
