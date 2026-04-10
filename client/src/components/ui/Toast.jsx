import { useEffect } from 'react';
import { useToastStore } from '../../store/toastStore';
import { cn } from '../../utils/cn';

const colors = {
  success: 'bg-green-light border-green text-green',
  error: 'bg-danger-light border-danger text-danger',
  info: 'bg-blue-light border-blue text-blue',
  warning: 'bg-amber-light border-[#b45309] text-[#b45309]',
};

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-[6px] border font-ui text-sm shadow-md min-w-[280px]', colors[toast.severity] || colors.info)}>
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">&times;</button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
