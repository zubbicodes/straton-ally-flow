import { useEffect, useState } from 'react';
import { Users, Clock, Calendar, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  departments: number;
}

interface RecentEmployee {
  id: string;
  full_name: string;
  email: string;
  designation: string | null;
  department: string | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    departments: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
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
          departments: deptCount || 0,
        });

        // Fetch recent employees with profile data
        const { data: employees } = await supabase
          .from('employees')
          .select(`
            id,
            designation,
            user_id,
            department_id,
            departments (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (employees) {
          const employeesWithProfiles = await Promise.all(
            employees.map(async (emp) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', emp.user_id)
                .single();

              return {
                id: emp.id,
                full_name: profile?.full_name || 'Unknown',
                email: profile?.email || '',
                designation: emp.designation,
                department: (emp.departments as any)?.name || null,
              };
            })
          );
          setRecentEmployees(employeesWithProfiles);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {greeting}, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/admin/employees/new">
          <Button variant="accent" size="lg">
            <Users className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={Clock}
        />
        <StatCard
          title="On Leave"
          value={stats.onLeave}
          icon={Calendar}
        />
        <StatCard
          title="Departments"
          value={stats.departments}
          icon={TrendingUp}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Employees</CardTitle>
            <Link to="/admin/employees">
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No employees yet</p>
                <Link to="/admin/employees/new" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">Add your first employee</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {employee.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.full_name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{employee.designation || 'N/A'}</p>
                      {employee.department && (
                        <Badge variant="secondary" className="mt-1">
                          {employee.department}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/employees/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-3" />
                Add New Employee
              </Button>
            </Link>
            <Link to="/admin/attendance" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-3" />
                Mark Attendance
              </Button>
            </Link>
            <Link to="/admin/salaries" className="block">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-3" />
                Manage Salaries
              </Button>
            </Link>
            <Link to="/admin/departments" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-3" />
                View Departments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
