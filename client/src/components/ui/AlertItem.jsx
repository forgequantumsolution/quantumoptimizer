import Badge from './Badge';
import Button from './Button';
import { cn } from '../../utils/cn';

const severityMap = { CRITICAL: 'risk', WARNING: 'warn', INFO: 'ok' };

export default function AlertItem({ severity, title, message, timestamp, onResolve, className }) {
  return (
    <div className={cn('flex items-start gap-4 p-4 rounded-[8px] border border-dark/8 bg-white', className)}>
      <Badge variant={severityMap[severity] || 'muted'}>{severity}</Badge>
      <div className="flex-1 min-w-0">
        <p className="font-ui text-sm font-semibold text-dark">{title}</p>
        <p className="font-ui text-xs text-mid mt-0.5 leading-relaxed">{message}</p>
        {timestamp && (
          <p className="font-ui text-[10px] text-muted mt-1">{timestamp}</p>
        )}
      </div>
      {onResolve && (
        <Button variant="outline" size="sm" onClick={onResolve} className="shrink-0">
          Resolve
        </Button>
      )}
    </div>
  );
}
