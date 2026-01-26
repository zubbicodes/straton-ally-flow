import { ChevronDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttendanceHeatmapProps {
  rate: number;
  trend: number;
}

export function AttendanceHeatmap({ rate, trend }: AttendanceHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['17:00', '15:00', '13:00', '11:00', '09:00', '07:00'];

  // Mock heatmap data - intensity 0-3
  const heatmapData = [
    [1, 2, 2, 2, 3, 0, 0], // 17:00
    [2, 3, 3, 3, 3, 1, 0], // 15:00
    [2, 3, 3, 3, 3, 1, 1], // 13:00
    [2, 2, 3, 3, 2, 0, 0], // 11:00
    [1, 2, 2, 2, 2, 0, 0], // 09:00
    [0, 1, 1, 1, 1, 0, 0], // 07:00
  ];

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-muted';
      case 1:
        return 'bg-muted-foreground/30';
      case 2:
        return 'bg-muted-foreground/60';
      case 3:
        return 'bg-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="card-elevated p-4 md:p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Attendance Overview</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1">
          This week
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-display font-bold">{rate}%</span>
        <span className="flex items-center gap-1 text-xs text-success font-medium">
          <TrendingUp className="h-3 w-3" />
          {trend}%
        </span>
        <span className="text-xs text-muted-foreground">vs last week</span>
      </div>

      {/* Heatmap */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute -left-10 top-0 flex flex-col justify-between h-full py-1">
          {hours.map((hour) => (
            <span key={hour} className="text-[10px] text-muted-foreground">{hour}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="ml-2">
          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((row, rowIndex) => (
              row.map((intensity, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    'h-6 md:h-8 rounded-sm transition-colors',
                    getIntensityClass(intensity)
                  )}
                />
              ))
            ))}
          </div>

          {/* X-axis labels */}
          <div className="grid grid-cols-7 gap-1 mt-2">
            {days.map((day) => (
              <span key={day} className="text-[10px] text-muted-foreground text-center">
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
