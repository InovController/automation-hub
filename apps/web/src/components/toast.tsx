import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHub } from '../contexts/hub-context';

export function ToastViewport() {
  const { toast, clearToast } = useHub();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 3000);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return createPortal(
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-slate-950/90 px-5 py-4 text-sm text-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      {toast}
    </div>,
    document.body,
  );
}
