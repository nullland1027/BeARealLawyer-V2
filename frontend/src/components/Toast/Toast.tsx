import { ToastType } from '../../types';
import './Toast.css';

interface ToastProps {
    message: string | null;
    type: ToastType;
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    if (!message) return null;

    const getIcon = () => {
        switch (type) {
            case 'error': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '⚠️';
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>✕</button>
        </div>
    );
}
