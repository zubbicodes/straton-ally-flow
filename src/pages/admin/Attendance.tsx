import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Search, Plus, Check, X, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  date: string;
  in_time: string | null;
  out_time: string | null;
  status: string;
  employee: {
    id: string;
    employee_id: string;
    full_name: string;
  };
}

interface Employee {
  id: string;
  employee_id: string;
  user_id: string;
  full_name: string;
}

export default function Attendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // New attendance form state
  const [newAttendance, setNewAttendance] = useState({
    employeeId: '',
    inTime: '',
    outTime: '',
    status: 'present',
  });

  const fetchEmployees = async () => {
    const { data: employeesData } = await supabase
      .from('employees')
      .select('id, employee_id, user_id')
      .order('employee_id');

    if (employeesData) {
      const withNames = await Promise.all(
        employeesData.map(async (emp) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', emp.user_id)
            .single();
          return {
            ...emp,
            full_name: profile?.full_name || 'Unknown',
          };
        })
      );
      setEmployees(withNames);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          in_time,
          out_time,
          status,
          employee_id
        `)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const withEmployeeInfo = await Promise.all(
          data.map(async (record) => {
            const { data: emp } = await supabase
              .from('employees')
              .select('id, employee_id, user_id')
              .eq('id', record.employee_id)
              .single();

            let fullName = 'Unknown';
            if (emp) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', emp.user_id)
                .single();
              fullName = profile?.full_name || 'Unknown';
            }

            return {
              ...record,
              employee: {
                id: emp?.id || '',
                employee_id: emp?.employee_id || '',
                full_name: fullName,
              },
            };
          })
        );
        setAttendance(withEmployeeInfo);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleAddAttendance = async () => {
    if (!newAttendance.employeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('attendance').insert({
        employee_id: newAttendance.employeeId,
        date: selectedDate,
        in_time: newAttendance.inTime || null,
        out_time: newAttendance.outTime || null,
        status: newAttendance.status,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance record added',
      });

      setIsDialogOpen(false);
      setNewAttendance({ employeeId: '', inTime: '', outTime: '', status: 'present' });
      fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add attendance',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="badge-success"><Check className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge className="badge-destructive"><X className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'half_day':
        return <Badge className="badge-warning"><Coffee className="h-3 w-3 mr-1" />Half Day</Badge>;
      case 'leave':
        return <Badge className="badge-info">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track and manage employee attendance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select
                  value={newAttendance.employeeId}
                  onValueChange={(value) =>
                    setNewAttendance({ ...newAttendance, employeeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>In Time</Label>
                  <Input
                    type="time"
                    value={newAttendance.inTime}
                    onChange={(e) =>
                      setNewAttendance({ ...newAttendance, inTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Out Time</Label>
                  <Input
                    type="time"
                    value={newAttendance.outTime}
                    onChange={(e) =>
                      setNewAttendance({ ...newAttendance, outTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newAttendance.status}
                  onValueChange={(value) =>
                    setNewAttendance({ ...newAttendance, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" variant="accent" onClick={handleAddAttendance}>
                Save Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Picker */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {attendance.length} records
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : attendance.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No attendance records for this date</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                Mark attendance
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>In Time</TableHead>
                  <TableHead>Out Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employee.full_name}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        {record.employee.employee_id}
                      </code>
                    </TableCell>
                    <TableCell>{record.in_time || '—'}</TableCell>
                    <TableCell>{record.out_time || '—'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
