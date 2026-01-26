import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card animate-slide-up', className)}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="stat-value">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium mb-1',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
