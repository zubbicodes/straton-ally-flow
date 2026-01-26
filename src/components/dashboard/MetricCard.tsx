import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <Card className={cn('border-border/50 shadow-none hover:shadow-sm transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>
            
            {trend && (
              <div className="flex items-center gap-1.5 mt-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          
          <div className={cn('p-2.5 rounded-lg bg-secondary', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
