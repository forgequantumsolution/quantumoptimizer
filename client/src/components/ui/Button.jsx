import { cn } from '../../utils/cn';

const variants = {
  gold: 'bg-gold hover:bg-gold2 text-white border-transparent',
  outline: 'bg-transparent border-dark text-dark hover:border-gold hover:text-gold',
  ghost: 'bg-transparent border-transparent text-mid hover:text-dark',
  danger: 'bg-danger hover:bg-red-700 text-white border-transparent',
};
const sizes = {
  sm: 'px-4 py-2 text-[10px] tracking-[0.14em]',
  md: 'px-6 py-3 text-[11px] tracking-[0.14em]',
  lg: 'px-8 py-4 text-[12px] tracking-[0.14em]',
};

export default function Button({ variant = 'gold', size = 'md', className, children, ...props }) {
  return (
    <button
      className={cn(
        'font-ui font-semibold uppercase border rounded-[3px] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
