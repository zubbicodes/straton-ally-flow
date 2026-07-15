import { useEffect, useMemo, useState } from 'react';
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

type Employee = { id: string; employee_id: string; full_name: string; office_name: string | null };
type Row = { date: string; status: string; in_time: string | null; check_in_at: string | null; total_work_minutes: number | null };
const config = { hours: { label: 'Worked hours', color: 'hsl(var(--primary))' } } satisfies ChartConfig;
const colors: Record<string, string> = { present: 'hsl(var(--primary))', half_day: 'hsl(var(--chart-4))', absent: 'hsl(var(--destructive))', leave: 'hsl(var(--muted-foreground))', missing: 'hsl(var(--muted))' };

export function MonthlyAttendanceChart({ employees, initialMonth }: { employees: Employee[]; initialMonth: string }) {
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(initialMonth.slice(0, 7));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employees.length) setEmployeeId('');
    else if (!employees.some(({ id }) => id === employeeId)) setEmployeeId(employees[0].id);
  }, [employeeId, employees]);

  useEffect(() => {
    if (!employeeId || !month) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const date = parseISO(`${month}-01`);
      const { data, error } = await supabase.from('attendance').select('date,status,in_time,check_in_at,total_work_minutes').eq('employee_id', employeeId).gte('date', format(startOfMonth(date), 'yyyy-MM-dd')).lte('date', format(endOfMonth(date), 'yyyy-MM-dd')).order('date');
      if (active) { if (error) console.error(error); setRows((data ?? []) as Row[]); setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [employeeId, month]);

  const days = useMemo(() => {
    if (!month) return [];
    const date = parseISO(`${month}-01`);
    const byDate = new Map(rows.map((row) => [row.date, row]));
    return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) }).map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const row = byDate.get(dateKey);
      const status = row?.status === 'absent' && (row.in_time || row.check_in_at) ? 'present' : row?.status ?? 'missing';
      return { date: dateKey, day: format(day, 'd'), status, hours: Number(((row?.total_work_minutes ?? 0) / 60).toFixed(1)) };
    });
  }, [month, rows]);

  const counts = useMemo(() => days.reduce((sum, day) => {
    if (day.status === 'present') sum.present++;
    if (day.status === 'absent') sum.absent++;
    if (day.status === 'half_day') sum.halfDay++;
    if (day.status === 'leave') sum.leave++;
    sum.hours += day.hours;
    return sum;
  }, { present: 0, absent: 0, halfDay: 0, leave: 0, hours: 0 }), [days]);

  return <Card className="card-elevated overflow-hidden">
    <CardHeader className="border-b bg-muted/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5" />Monthly employee attendance</CardTitle><CardDescription>View one employee's full month and daily worked hours.</CardDescription></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
          <div className="flex flex-col gap-2"><Label>Employee</Label><Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent><SelectGroup>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.full_name} ({employee.employee_id})</SelectItem>)}</SelectGroup></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><Label htmlFor="chart-month">Month</Label><Input id="chart-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-5 pt-6">
      <div className="flex flex-wrap gap-2"><Badge variant="outline">Present {counts.present}</Badge><Badge variant="outline">Half day {counts.halfDay}</Badge><Badge variant="outline">Absent {counts.absent}</Badge><Badge variant="outline">Leave {counts.leave}</Badge><Badge variant="secondary">{counts.hours.toFixed(1)} total hours</Badge></div>
      {loading ? <div className="flex h-[300px] items-center justify-center text-muted-foreground">Loading month…</div> : <ChartContainer config={config} className="h-[300px] w-full aspect-auto"><BarChart data={days}><CartesianGrid vertical={false} /><XAxis dataKey="day" interval={0} axisLine={false} tickLine={false} /><YAxis width={34} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}h`} /><ChartTooltip content={<ChartTooltipContent labelFormatter={(day) => `${month}-${String(day).padStart(2, '0')}`} />} /><Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={18}>{days.map((day) => <Cell key={day.date} fill={colors[day.status] ?? colors.missing} />)}</Bar></BarChart></ChartContainer>}
    </CardContent>
  </Card>;
}
