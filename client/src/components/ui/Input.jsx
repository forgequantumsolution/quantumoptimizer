import { cn } from '../../utils/cn';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full bg-cream border border-dark/15 rounded-[4px] px-4 py-3 font-ui text-sm text-dark placeholder:text-muted2 focus:outline-none focus:border-gold transition-colors',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="font-ui text-[11px] text-danger">{error}</p>}
    </div>
  );
}
