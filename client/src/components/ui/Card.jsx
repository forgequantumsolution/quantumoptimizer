import { cn } from '../../utils/cn';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-dark/10 rounded-[10px] p-5 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
