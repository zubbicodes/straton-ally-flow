import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SatisfactionData {
  verySatisfied: number;
  satisfied: number;
  dissatisfied: number;
  avgSatisfaction: number;
  yearChange: number;
}

interface SatisfactionCardProps {
  data: SatisfactionData;
}

export function SatisfactionCard({ data }: SatisfactionCardProps) {
  const chartData = [
    { name: 'Very Satisfied', value: data.verySatisfied, color: 'hsl(var(--success))' },
    { name: 'Satisfied', value: data.satisfied, color: 'hsl(var(--success) / 0.5)' },
    { name: 'Dissatisfied', value: data.dissatisfied, color: 'hsl(var(--muted))' },
  ];

  const categories = [
    { name: 'Compensation & Benefits', value: 78 },
    { name: 'Work Culture', value: 74 },
    { name: 'Work-Life Balance', value: 71 },
    { name: 'Career Growth Opportunities', value: 68 },
  ];

  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <h3 className="text-sm md:text-base font-semibold">Employee Satisfaction</h3>
        </div>
        
        <div className="flex gap-3 md:gap-4">
          <div className="relative w-[90px] h-[90px] md:w-[120px] md:h-[120px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-base md:text-lg font-bold">{data.avgSatisfaction}%</p>
                <p className="text-[8px] md:text-[10px] text-muted-foreground">avg.</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-1 md:space-y-1.5 text-[10px] md:text-xs min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="truncate">Very Satisfied</span>
              <span className="ml-auto font-medium">{data.verySatisfied}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2 h-2 rounded-full bg-success/50 flex-shrink-0" />
              <span className="truncate">Satisfied</span>
              <span className="ml-auto font-medium">{data.satisfied}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
              <span className="truncate">Dissatisfied</span>
              <span className="ml-auto font-medium">{data.dissatisfied}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-success/5 rounded-lg border border-success/10">
          <p className="text-[10px] md:text-xs">
            <span className="font-semibold">+{data.yearChange}%</span> from last year
          </p>
        </div>
        
        <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between text-[10px] md:text-xs mb-1 gap-2">
                <span className="truncate">{cat.name}</span>
                <span className="font-medium flex-shrink-0">{cat.value}%</span>
              </div>
              <Progress value={cat.value} className="h-1 md:h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
