import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const performanceData = [
  { day: 'Sun', sales: 60, design: 45, ops: 30 },
  { day: 'Mon', sales: 85, design: 70, ops: 55 },
  { day: 'Tue', sales: 75, design: 60, ops: 80 },
  { day: 'Wed', sales: 90, design: 85, ops: 70 },
  { day: 'Thu', sales: 65, design: 50, ops: 60 },
];

interface TeamPerformanceProps {
  rate?: number;
  trend?: number;
}

export function TeamPerformance({ rate = 93.3, trend = 3.84 }: TeamPerformanceProps) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Team Performance</CardTitle>
        <Select defaultValue="month">
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{rate}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-success font-medium">+{trend}%</span>
            <span>Increased vs last week</span>
          </div>
        </div>
        
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} barSize={12} barGap={2}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="sales" fill="hsl(var(--success) / 0.3)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="design" fill="hsl(var(--success) / 0.6)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ops" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-success/30" />
            <span className="text-muted-foreground">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-success/60" />
            <span className="text-muted-foreground">Product Design</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-success" />
            <span className="text-muted-foreground">Operation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
