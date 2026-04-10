import Card from './Card';
import { cn } from '../../utils/cn';

export default function KPICard({ value, label, subtext, trend, className }) {
  const isPositive = trend && (trend.startsWith('+') || trend.startsWith('↑'));
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className="font-display text-3xl font-bold text-dark leading-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={cn('font-ui text-xs font-semibold', isPositive ? 'text-green' : 'text-danger')}>
            {trend}
          </span>
        )}
        {subtext && <span className="font-ui text-xs text-muted">{subtext}</span>}
      </div>
    </Card>
  );
}
