import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconColor = 'text-primary',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('border-border/50 shadow-none', className)}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{title}</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-lg md:text-2xl font-bold tracking-tight">{value}</span>
              {subtitle && (
                <span className="text-[10px] md:text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-[10px] md:text-xs">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive flex-shrink-0" />
                )}
                <span className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-muted-foreground hidden sm:inline">{trend.label}</span>
              </div>
            )}
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
