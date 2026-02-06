import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Search, Plus, Check, X, Coffee, LogOutIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatTime12h } from '@/lib/utils';
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
  /** Scheduled start/end for this date (from template or custom), for badge logic */
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
}

interface Employee {
  id: string;
  employee_id: string;
  user_id: string;
  full_name: string;
}

interface EarlyCheckoutRequestRow {
  id: string;
  employee_id: string;
  date: string;
  reason: string;
  requested_checkout_time: string;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  response_notes?: string | null;
  employee?: { employee_id: string; full_name?: string };
}

export default function Attendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [earlyRequests, setEarlyRequests] = useState<EarlyCheckoutRequestRow[]>([]);
  const [reviewModal, setReviewModal] = useState<{ id: string; employeeName: string; reason: string; time: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'decline' | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
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
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const selectedDayName = dayNames[new Date(selectedDate + 'T12:00:00').getDay()];

        const withEmployeeInfo = await Promise.all(
          data.map(async (record) => {
            const { data: emp } = await supabase
              .from('employees')
              .select('id, employee_id, user_id, duty_schedule_template_id, custom_work_start_time, custom_work_end_time')
              .eq('id', record.employee_id)
              .single();

            let fullName = 'Unknown';
            let scheduleStart: string | null = null;
            let scheduleEnd: string | null = null;

            if (emp) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', emp.user_id)
                .single();
              fullName = profile?.full_name || 'Unknown';

              if (emp.custom_work_start_time) scheduleStart = String(emp.custom_work_start_time).slice(0, 8);
              if (emp.custom_work_end_time) scheduleEnd = String(emp.custom_work_end_time).slice(0, 8);
              if ((!scheduleStart || !scheduleEnd) && emp.duty_schedule_template_id) {
                const { data: template } = await supabase
                  .from('duty_schedule_templates')
                  .select('start_time, end_time, work_days')
                  .eq('id', emp.duty_schedule_template_id)
                  .single();
                const workDays = (template?.work_days as string[] | null) ?? [];
                if (template && workDays.map((d) => d?.toLowerCase()).includes(selectedDayName)) {
                  if (!scheduleStart && template.start_time) scheduleStart = String(template.start_time).slice(0, 8);
                  if (!scheduleEnd && template.end_time) scheduleEnd = String(template.end_time).slice(0, 8);
                }
              }
            }

            return {
              ...record,
              employee: {
                id: emp?.id || '',
                employee_id: emp?.employee_id || '',
                full_name: fullName,
              },
              scheduleStart: scheduleStart ?? null,
              scheduleEnd: scheduleEnd ?? null,
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
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add attendance',
        variant: 'destructive',
      });
    }
  };

  const fetchEarlyCheckoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('early_checkout_requests')
        .select('id, employee_id, date, reason, requested_checkout_time, status, created_at, reviewed_at, response_notes')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data?.length) {
        const withNames = await Promise.all(
          (data as EarlyCheckoutRequestRow[]).map(async (row) => {
            const { data: emp } = await supabase
              .from('employees')
              .select('id, employee_id, user_id')
              .eq('id', row.employee_id)
              .single();
            if (!emp) return { ...row, employee: { employee_id: '', full_name: 'Unknown' } };
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', emp.user_id).single();
            return {
              ...row,
              employee: { employee_id: emp.employee_id, full_name: profile?.full_name ?? 'Unknown' },
            };
          }),
        );
        setEarlyRequests(withNames);
      } else {
        setEarlyRequests([]);
      }
    } catch (e) {
      console.error('Error fetching early checkout requests:', e);
      setEarlyRequests([]);
    }
  };

  const openReview = (req: EarlyCheckoutRequestRow, action: 'approve' | 'decline') => {
    setReviewModal({
      id: req.id,
      employeeName: req.employee?.full_name ?? 'Unknown',
      reason: req.reason,
      time: req.requested_checkout_time,
    });
    setReviewAction(action);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!reviewModal || !reviewAction) return;
    setReviewSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('early_checkout_requests')
        .update({
          status: reviewAction === 'approve' ? 'approved' : 'declined',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.user?.id ?? null,
          response_notes: reviewNotes.trim() || null,
        })
        .eq('id', reviewModal.id);

      if (error) throw error;
      toast({
        title: reviewAction === 'approve' ? 'Request approved' : 'Request declined',
        description: reviewAction === 'approve'
          ? 'The employee can now check out at the requested time.'
          : 'The employee has been notified.',
      });
      setReviewModal(null);
      setReviewAction(null);
      setReviewNotes('');
      await fetchEarlyCheckoutRequests();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update request',
        variant: 'destructive',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEarlyCheckoutRequests();
  }, []);

  /** Compare two time strings "HH:mm:ss" or "HH:mm". Returns -1 if a < b, 0 if equal, 1 if a > b */
  const compareTime = (a: string | null | undefined, b: string | null | undefined): number => {
    if (!a || !b) return 0;
    const parts = (t: string) => t.trim().split(':');
    const toNorm = (t: string) => {
      const p = parts(t);
      const h = (p[0] ?? '0').padStart(2, '0');
      const m = (p[1] ?? '0').padStart(2, '0');
      const s = (p[2] ?? '0').padStart(2, '0');
      return `${h}:${m}:${s}`;
    };
    const na = toNorm(a);
    const nb = toNorm(b);
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
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

  const getTimingBadges = (record: AttendanceRecord) => {
    const badges: React.ReactNode[] = [];
    const { in_time, out_time, status, scheduleStart, scheduleEnd } = record;
    if (status === 'absent') return badges;
    if (scheduleStart && in_time) {
      const cmpIn = compareTime(in_time, scheduleStart);
      if (cmpIn < 0) badges.push(<Badge key="early-in" variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">Early check-in</Badge>);
      if (cmpIn > 0) badges.push(<Badge key="late" variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-0">Late</Badge>);
    }
    if (scheduleEnd && out_time) {
      const cmpOut = compareTime(out_time, scheduleEnd);
      if (cmpOut < 0) badges.push(<Badge key="early-out" variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-0">Early check-out</Badge>);
    }
    return badges;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track and manage employee attendance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="lg" className="w-full sm:w-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Early check-out requests */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOutIcon className="h-5 w-5" />
            Early check-out requests
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Approve or decline pending requests. Approved and rejected requests are listed below.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(() => {
            const pending = earlyRequests.filter((r) => r.status === 'pending');
            const approved = earlyRequests.filter((r) => r.status === 'approved');
            const declined = earlyRequests.filter((r) => r.status === 'declined');
            return (
              <>
                {/* Pending */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Pending</h3>
                  {pending.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No pending requests.</p>
                  ) : (
                    <div className="space-y-3">
                      {pending.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{req.employee?.full_name ?? 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {req.employee?.employee_id} · {format(new Date(req.date), 'MMM d, yyyy')} · Leave at {formatTime12h(req.requested_checkout_time)}
                            </p>
                            <p className="text-sm mt-1">{req.reason}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openReview(req, 'approve')}>
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openReview(req, 'decline')}>
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Approved */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Approved</h3>
                  {approved.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None.</p>
                  ) : (
                    <div className="space-y-3">
                      {approved.map((req) => (
                        <div key={req.id} className="rounded-lg border p-3">
                          <p className="font-medium">{req.employee?.full_name ?? 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {req.employee?.employee_id} · {format(new Date(req.date), 'MMM d, yyyy')} · Leave at {formatTime12h(req.requested_checkout_time)}
                          </p>
                          <p className="text-sm mt-1">{req.reason}</p>
                          {req.reviewed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Reviewed {format(new Date(req.reviewed_at), 'MMM d, yyyy h:mm a')}
                              {req.response_notes ? ` · ${req.response_notes}` : ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Rejected */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Rejected</h3>
                  {declined.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None.</p>
                  ) : (
                    <div className="space-y-3">
                      {declined.map((req) => (
                        <div key={req.id} className="rounded-lg border p-3">
                          <p className="font-medium">{req.employee?.full_name ?? 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {req.employee?.employee_id} · {format(new Date(req.date), 'MMM d, yyyy')} · Leave at {formatTime12h(req.requested_checkout_time)}
                          </p>
                          <p className="text-sm mt-1">{req.reason}</p>
                          {req.reviewed_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Reviewed {format(new Date(req.reviewed_at), 'MMM d, yyyy h:mm a')}
                              {req.response_notes ? ` · ${req.response_notes}` : ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Date Picker */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto min-w-[150px]"
              />
            </div>
            <Badge variant="secondary" className="text-sm w-fit">
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
            <div className="overflow-x-auto">
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
                    <TableCell>{formatTime12h(record.in_time)}</TableCell>
                    <TableCell>{formatTime12h(record.out_time)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {getStatusBadge(record.status)}
                        {getTimingBadges(record)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review early checkout modal */}
      <Dialog open={!!reviewModal} onOpenChange={(open) => !open && setReviewModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approve' ? 'Approve' : 'Decline'} early check-out</DialogTitle>
          </DialogHeader>
          {reviewModal && (
            <>
              <p className="text-sm">
                <span className="font-medium">{reviewModal.employeeName}</span> requested to leave at {formatTime12h(reviewModal.time)}.
              </p>
              <p className="text-sm text-muted-foreground">Reason: {reviewModal.reason}</p>
              <div className="space-y-2">
                <Label>Response notes (optional)</Label>
                <Textarea
                  placeholder="e.g. Approved for medical appointment"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setReviewModal(null)} disabled={reviewSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === 'decline' ? 'destructive' : 'default'}
                  className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Saving...' : reviewAction === 'approve' ? 'Approve' : 'Decline'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
