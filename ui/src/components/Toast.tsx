import { X } from 'lucide-react';
import type { ToastItem } from '../hooks/useToast.ts';

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const toneMap = {
  info: 'bg-slate-800 text-white',
  success: 'bg-emerald-600 text-white',
  error: 'bg-rose-600 text-white',
};

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`${toneMap[t.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm animate-in slide-in-from-right`}>
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
