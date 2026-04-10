import { useEffect } from 'react';
import { cn } from '../../utils/cn';

export default function Modal({ isOpen, onClose, title, children, className }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-[10px] shadow-2xl p-8 w-full max-w-lg mx-4', className)}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-dark transition-colors text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
