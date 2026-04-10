import { cn } from '../../utils/cn';

const variants = {
  ok: 'bg-green-light text-green',
  warn: 'bg-amber-light text-[#b45309]',
  risk: 'bg-danger-light text-danger',
  info: 'bg-blue-light text-blue',
  muted: 'bg-cream3 text-muted',
};

export default function Badge({ variant = 'muted', className, children }) {
  return (
    <span
      className={cn(
        'font-ui text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-sm inline-block',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
