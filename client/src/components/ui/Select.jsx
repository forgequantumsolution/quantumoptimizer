import { cn } from '../../utils/cn';

export default function Select({ label, options = [], error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full bg-cream border border-dark/15 rounded-[4px] px-4 py-3 font-ui text-sm text-dark focus:outline-none focus:border-gold transition-colors',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="font-ui text-[11px] text-danger">{error}</p>}
    </div>
  );
}
