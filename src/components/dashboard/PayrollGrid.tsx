import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PayrollGridProps {
  takeHomePay: string;
  paymentPercentage: number;
}

export function PayrollGrid({ takeHomePay, paymentPercentage }: PayrollGridProps) {
  // Generate grid data - 6x6 grid with varying intensities
  const gridData = [
    [3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3],
    [2, 2, 3, 3, 3, 3],
    [2, 2, 2, 3, 3, 3],
    [1, 2, 2, 2, 3, 3],
    [1, 1, 2, 2, 2, 3],
  ];

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-success/20';
      case 2:
        return 'bg-success/50';
      case 3:
        return 'bg-success';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="card-elevated p-3 md:p-4 rounded-lg h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Payroll</h3>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground gap-1 px-2">
          Monthly
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Payroll Grid */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {gridData.map((row, rowIndex) => (
          row.map((intensity, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'aspect-square rounded-full transition-colors',
                getIntensityClass(intensity)
              )}
            />
          ))
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Take home pay</p>
          <p className="text-sm font-semibold">{takeHomePay}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Payment</p>
          <p className="text-sm font-semibold">{paymentPercentage}%</p>
        </div>
      </div>
    </div>
  );
}
