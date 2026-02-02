import { useState, useEffect, useCallback } from 'react';
import { ToastType } from '../types';

interface UseToastReturn {
    toastMessage: string | null;
    toastType: ToastType;
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
}

export function useToast(): UseToastReturn {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<ToastType>('error');

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = useCallback((message: string, type: ToastType = 'error') => {
        setToastMessage(message);
        setToastType(type);
    }, []);

    const hideToast = useCallback(() => {
        setToastMessage(null);
    }, []);

    return {
        toastMessage,
        toastType,
        showToast,
        hideToast,
    };
}
