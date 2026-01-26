import { useEffect, useState } from 'react';
import { Users, Clock, FileText, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { PayrollTable } from '@/components/dashboard/PayrollTable';
import { SatisfactionCard } from '@/components/dashboard/QuickStats';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  departments: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
    departments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch employee count
        const { count: employeeCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        // Fetch department count
        const { count: deptCount } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true });

        // Fetch today's attendance
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);

        const presentToday = attendanceData?.filter(a => a.status === 'present').length || 0;
        const onLeave = attendanceData?.filter(a => a.status === 'leave').length || 0;

        setStats({
          totalEmployees: employeeCount || 0,
          presentToday,
          onLeave,
          pendingLeaves: 34, // Mock data for demo
          departments: deptCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Mock data for charts
  const attendanceChartData = Array.from({ length: 22 }, (_, i) => ({
    day: String(i + 1).padStart(2, '0'),
    time: '09:00 AM',
    value: 8 + Math.random() * 2,
  }));

  const mockPayrollData = [
    { id: '1', name: 'Vikas Tiwari', employeeId: 'TN-0178', jobTitle: 'UI Designer', department: 'Product Design', salary: 3530, deduction: 130, total: 3400 },
    { id: '2', name: 'Ramesh Gupta', employeeId: 'TN-0289', jobTitle: 'HR Officer', department: 'Human Resources', salary: 3685, deduction: 110, total: 3575 },
    { id: '3', name: 'Sunil Bhadouriya', employeeId: 'TN-0234', jobTitle: 'Marketing', department: 'Executive Marketing', salary: 3200, deduction: 120, total: 3590 },
  ];

  const satisfactionData = {
    verySatisfied: 421,
    satisfied: 103,
    dissatisfied: 13,
    avgSatisfaction: 73,
    yearChange: 6,
  };

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <DashboardHeader 
        userName={user?.fullName || 'Admin'} 
        userRole="HR Executive" 
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          trend={{ value: 3.84, isPositive: true, label: 'vs last week' }}
        />
        <MetricCard
          title="Attendance"
          value={`${attendanceRate}%`}
          subtitle="Present"
          icon={Clock}
        />
        <MetricCard
          title="Applications"
          value="49"
          subtitle="New"
          icon={FileText}
          trend={{ value: 1.23, isPositive: false, label: 'vs last week' }}
        />
        <MetricCard
          title="Leave"
          value={stats.pendingLeaves}
          subtitle="Pending"
          icon={CalendarDays}
          trend={{ value: 0.25, isPositive: false, label: 'vs last week' }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2 min-w-0">
          <AttendanceChart
            data={attendanceChartData}
            rate={92}
            trend={1.54}
            onTime={220}
            late={15}
            absent={15}
          />
        </div>
        <div className="min-w-0">
          <TeamPerformance rate={93.3} trend={3.84} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="min-w-0">
          <SatisfactionCard data={satisfactionData} />
        </div>
        <div className="lg:col-span-2 min-w-0 overflow-x-auto">
          <PayrollTable employees={mockPayrollData} />
        </div>
      </div>
    </div>
  );
}
