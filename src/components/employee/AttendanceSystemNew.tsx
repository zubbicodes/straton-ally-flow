import { useState, useEffect } from 'react';
import { Clock, MapPin, Coffee, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  in_time: string | null;
  out_time: string | null;
  break_duration: string | null;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  notes: string | null;
  created_at: string;
  employee_id: string;
}

interface LocationInfo {
  isAllowed: boolean;
  officeIPs: string[];
  currentIP: string | null;
  distance: number | null;
}

export function AttendanceSystem() {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    isAllowed: false,
    officeIPs: [],
    currentIP: null,
    distance: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance and check location
  useEffect(() => {
    fetchTodayAttendance();
    checkLocationPermission();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user?.id) return;

      // Get employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!employee) return;

      // Get today's attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .maybeSingle();

      if (attendanceData) {
        setAttendance({
          id: attendanceData.id,
          date: attendanceData.date,
          in_time: attendanceData.in_time,
          out_time: attendanceData.out_time,
          break_duration: attendanceData.break_duration as string || null,
          status: attendanceData.status as 'present' | 'absent' | 'half_day' | 'leave',
          notes: attendanceData.notes,
          created_at: attendanceData.created_at,
          employee_id: attendanceData.employee_id
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      // Get user's IP address
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      // Get allowed office IPs from settings (you'd store this in your database)
      const officeIPs = [
        '192.168.1.0/24',    // Office network range
        '10.0.0.0/24',       // Another office network
        '203.0.113.0/24'     // Corporate network
      ];

      // Check if current IP is in allowed range
      const isAllowed = isIPInAllowedRange(ip, officeIPs);

      setLocationInfo({
        isAllowed,
        officeIPs,
        currentIP: ip,
        distance: null // You could implement geolocation distance check here
      });
    } catch (error) {
      console.error('Error checking location:', error);
      setLocationInfo(prev => ({
        ...prev,
        isAllowed: false,
        currentIP: 'Unknown'
      }));
    }
  };

  const isIPInAllowedRange = (userIP: string, allowedRanges: string[]): boolean => {
    // Simple IP range checking (you might want to use a proper IP range library)
    return allowedRanges.some(range => {
      if (range.includes('/')) {
        // CIDR notation - simplified check
        const [network, prefix] = range.split('/');
        const networkParts = network.split('.').map(Number);
        const userParts = userIP.split('.').map(Number);
        
        // Simple check for demonstration - you'd want proper CIDR logic
        return networkParts.slice(0, 2).every((part, i) => part === userParts[i]);
      } else {
        return userIP === range;
      }
    });
  };

  const handleCheckIn = async () => {
    if (!locationInfo.isAllowed) {
      toast({
        title: "Location Restricted",
        description: "You can only mark attendance from the office network.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = format(new Date(), 'HH:mm:ss');
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user?.id) return;

      // Get employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!employee) return;

      // Check if already checked in
      if (attendance?.in_time) {
        toast({
          title: "Already Checked In",
          description: "You have already checked in today.",
          variant: "destructive"
        });
        return;
      }

      // Determine status based on time
      const hour = new Date().getHours();
      const status = hour >= 9 ? 'present' : 'present'; // Simplified - always 'present' for now

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: today,
          in_time: now,
          status,
          notes: null
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAttendance({
          id: data.id,
          date: data.date,
          in_time: data.in_time,
          out_time: data.out_time,
          break_duration: data.break_duration as string || null,
          status: data.status as 'present' | 'absent' | 'half_day' | 'leave',
          notes: data.notes,
          created_at: data.created_at,
          employee_id: data.employee_id
        });
      }

      toast({
        title: "Checked In Successfully",
        description: `You checked in at ${now}`,
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!locationInfo.isAllowed) {
      toast({
        title: "Location Restricted",
        description: "You can only mark attendance from the office network.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const now = format(new Date(), 'HH:mm:ss');
      
      if (!attendance?.id) return;

      // Calculate total hours
      const inTime = new Date(`2000-01-01T${attendance.in_time}`);
      const outTime = new Date(`2000-01-01T${now}`);
      const totalMs = outTime.getTime() - inTime.getTime();
      const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHoursStr = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('attendance')
        .update({
          out_time: now,
          notes: `Total hours: ${totalHoursStr}`
        })
        .eq('id', attendance.id);

      if (error) throw error;

      setAttendance(prev => prev ? { ...prev, out_time: now, notes: `Total hours: ${totalHoursStr}` } : null);
      toast({
        title: "Checked Out Successfully",
        description: `You checked out at ${now}. Total hours: ${totalHoursStr}`,
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!attendance) return <Badge variant="secondary">Not Marked</Badge>;
    
    switch (attendance.status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'half_day':
        return <Badge className="bg-orange-100 text-orange-800">Half Day</Badge>;
      default:
        return <Badge variant="secondary">{attendance.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Status */}
      <Alert className={locationInfo.isAllowed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {locationInfo.isAllowed ? 
                "✓ You are within the office network" : 
                "⚠ You are not in the office network. Attendance cannot be marked."
              }
            </span>
            <span className="text-sm text-muted-foreground">
              IP: {locationInfo.currentIP || 'Checking...'}
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Current Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <p className="text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Attendance</span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Check In</p>
              <p className="font-medium">
                {attendance?.in_time || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check Out</p>
              <p className="font-medium">
                {attendance?.out_time || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Break Duration</p>
              <p className="font-medium">
                {attendance?.break_duration || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-medium">
                {attendance?.notes?.includes('Total hours') ? attendance.notes.split('Total hours: ')[1] : '—'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            {!attendance?.in_time ? (
              <Button 
                onClick={handleCheckIn}
                disabled={!locationInfo.isAllowed || isLoading}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Check In
              </Button>
            ) : (
              !attendance?.out_time && (
                <Button 
                  onClick={handleCheckOut}
                  disabled={!locationInfo.isAllowed || isLoading}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Check Out
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
