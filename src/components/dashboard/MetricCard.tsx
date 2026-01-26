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
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn(
      'card-elevated p-3 md:p-4 rounded-lg animate-fade-in',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
      </div>
      
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            {value}
          </span>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            trend.isPositive ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
