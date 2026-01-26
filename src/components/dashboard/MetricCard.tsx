import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  valueUnit?: string;
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, valueUnit, className }: MetricCardProps) {
  return (
    <div className={cn(
      'card-elevated p-3 rounded-lg animate-fade-in',
      className
    )}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
        <p className="text-[10px] font-medium text-muted-foreground truncate">{title}</p>
      </div>
      
      <div className="flex items-end justify-between gap-1">
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-display font-bold tracking-tight">
              {value}
            </span>
            {valueUnit && (
              <span className="text-xs text-muted-foreground">{valueUnit}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-[9px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <span className={cn(
            'text-[10px] font-medium flex items-center gap-0.5 px-1 py-0.5 rounded',
            trend.isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
