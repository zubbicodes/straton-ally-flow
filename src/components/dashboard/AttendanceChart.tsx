import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AttendanceChartProps {
  data: Array<{ day: string; time: string; value: number }>;
  rate: number;
  trend: number;
  onTime: number;
  late: number;
  absent: number;
}

export function AttendanceChart({ data, rate, trend, onTime, late, absent }: AttendanceChartProps) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Attendance Report</CardTitle>
        <Select defaultValue="october">
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="october">October</SelectItem>
            <SelectItem value="september">September</SelectItem>
            <SelectItem value="august">August</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-6 mb-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{rate}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success font-medium">+{trend}%</span>
              <span>Attendance Rate</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-border" />
          
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">On Time</p>
              <p className="font-semibold">{onTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Late</p>
              <p className="font-semibold">{late}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Absent</p>
              <p className="font-semibold">{absent}</p>
            </div>
          </div>
        </div>
        
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={8}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  const hours = Math.floor(value);
                  const mins = Math.round((value - hours) * 60);
                  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} AM`;
                }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
