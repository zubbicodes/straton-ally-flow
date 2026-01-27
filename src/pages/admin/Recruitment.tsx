import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  Shield,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  Key,
  Lock,
  Unlock,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  TrendingUp,
  UserCheck,
  Briefcase,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Mock data for demonstration
const mockEmployees = [
  {
    id: '1',
    employee_id: 'EMP001',
    full_name: 'John Doe',
    email: 'john@example.com',
    designation: 'Senior Developer',
    department: 'Engineering',
    office_id: '1',
    office_name: 'Headquarters',
    status: 'active',
    joining_date: '2024-01-15',
  },
  {
    id: '2',
    employee_id: 'EMP002',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    designation: 'HR Manager',
    department: 'Human Resources',
    office_id: '1',
    office_name: 'Headquarters',
    status: 'active',
    joining_date: '2024-02-01',
  },
  {
    id: '3',
    employee_id: 'EMP003',
    full_name: 'Mike Johnson',
    email: 'mike@example.com',
    designation: 'Sales Executive',
    department: 'Sales',
    office_id: '2',
    office_name: 'Branch Office',
    status: 'active',
    joining_date: '2024-03-10',
  },
];

const mockOffices = [
  {
    id: '1',
    name: 'Headquarters',
    address: '123 Business Avenue',
    city: 'New York',
    country: 'United States',
    is_active: true,
    settings: {
      work_start_time: '09:00:00',
      work_end_time: '17:00:00',
      timezone: 'America/New_York',
      require_ip_whitelist: false,
      geo_fencing_enabled: false,
    },
    _count: { employees: 2, departments: 5 },
  },
  {
    id: '2',
    name: 'Branch Office',
    address: '456 Market Street',
    city: 'San Francisco',
    country: 'United States',
    is_active: true,
    settings: {
      work_start_time: '08:00:00',
      work_end_time: '16:00:00',
      timezone: 'America/Los_Angeles',
      require_ip_whitelist: true,
      geo_fencing_enabled: true,
    },
    _count: { employees: 1, departments: 3 },
  },
];

const mockDutySchedules = [
  {
    id: '1',
    schedule_name: 'Regular Day Shift',
    shift_type: 'regular',
    start_time: '09:00:00',
    end_time: '17:00:00',
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    is_active: true,
    employee: {
      employee_id: 'EMP001',
      profile: { full_name: 'John Doe', email: 'john@example.com' },
    },
    office: { name: 'Headquarters' },
  },
  {
    id: '2',
    schedule_name: 'Night Shift',
    shift_type: 'night',
    start_time: '22:00:00',
    end_time: '06:00:00',
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    is_active: true,
    employee: {
      employee_id: 'EMP002',
      profile: { full_name: 'Jane Smith', email: 'jane@example.com' },
    },
    office: { name: 'Headquarters' },
  },
];

const mockAccessControls = [
  {
    id: '1',
    access_level: 'full',
    allowed_areas: ['main_office', 'server_room', 'conference_rooms'],
    ip_override: true,
    is_active: true,
    employee: {
      employee_id: 'EMP001',
      profile: { full_name: 'John Doe', email: 'john@example.com' },
    },
    office: {
      name: 'Headquarters',
      settings: { require_ip_whitelist: false, geo_fencing_enabled: false },
    },
  },
  {
    id: '2',
    access_level: 'restricted',
    allowed_areas: ['main_office', 'break_room'],
    ip_override: false,
    is_active: true,
    employee: {
      employee_id: 'EMP002',
      profile: { full_name: 'Jane Smith', email: 'jane@example.com' },
    },
    office: {
      name: 'Headquarters',
      settings: { require_ip_whitelist: true, geo_fencing_enabled: true },
    },
  },
];

export default function Recruitment() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleStatusToggle = (type: string, id: string, currentStatus: boolean) => {
    toast({
      title: 'Status updated',
      description: `${type} has been ${!currentStatus ? 'activated' : 'deactivated'}`,
    });
  };

  const handleDelete = (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    toast({
      title: `${type} deleted`,
      description: `${type} has been removed successfully`,
    });
  };

  const getShiftTypeIcon = (shiftType: string) => {
    switch (shiftType) {
      case 'regular': return <Clock className="h-4 w-4" />;
      case 'rotating': return <RotateCcw className="h-4 w-4" />;
      case 'flexible': return <PlayCircle className="h-4 w-4" />;
      case 'night': return <PauseCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'badge-success';
      case 'restricted': return 'badge-warning';
      case 'read_only': return 'default';
      default: return 'default';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'full': return <Unlock className="h-4 w-4" />;
      case 'restricted': return <Lock className="h-4 w-4" />;
      case 'read_only': return <Key className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Recruitment & Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage offices, duty schedules, access control, and recruitment activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/employees/new">
            <Button variant="accent" size="lg">
              <UserCheck className="h-5 w-5 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Offices</p>
                <p className="text-2xl font-bold">{mockOffices.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{mockEmployees.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Schedules</p>
                <p className="text-2xl font-bold">{mockDutySchedules.filter(s => s.is_active).length}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Rules</p>
                <p className="text-2xl font-bold">{mockAccessControls.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee-Office
          </TabsTrigger>
          <TabsTrigger value="offices" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Offices
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Duty Schedules
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Control
          </TabsTrigger>
        </TabsList>

        {/* Employee-Office Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee-Office Assignments
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Employee
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmployees
                    .filter(emp => 
                      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      emp.office_name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-secondary px-2 py-1 rounded">
                          {employee.employee_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{employee.office_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(employee.joining_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={employee.status === 'active' ? 'badge-success' : 'badge-destructive'}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Change Office
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Assignment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Office Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockOffices.map((office) => (
              <Card className="card-elevated" key={office.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {office.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Employees</span>
                      <Badge variant="outline">{mockEmployees.filter(emp => emp.office_id === office.id).length}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Employees:</p>
                      <div className="space-y-1">
                        {mockEmployees
                          .filter(emp => emp.office_id === office.id)
                          .map(emp => (
                            <div key={emp.id} className="flex items-center justify-between text-sm">
                              <span>{emp.full_name}</span>
                              <Badge variant="outline" className="text-xs">{emp.designation}</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Offices Tab */}
        <TabsContent value="offices" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Office Management
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Office
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOffices.map((office) => (
                  <div key={office.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{office.name}</h3>
                        <p className="text-sm text-muted-foreground">{office.city}, {office.country}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={office.is_active ? 'badge-success' : 'badge-destructive'}>
                          {office.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={office.is_active}
                          onCheckedChange={() => handleStatusToggle('Office', office.id, office.is_active)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{office.settings.work_start_time} - {office.settings.work_end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{office._count.employees} employees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{office.settings.timezone}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {office.settings.require_ip_whitelist && (
                        <Badge variant="outline" className="text-xs">
                          <Wifi className="h-3 w-3 mr-1" />
                          IP Restricted
                        </Badge>
                      )}
                      {office.settings.geo_fencing_enabled && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Geo Fencing
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duty Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Duty Schedules
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDutySchedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{schedule.schedule_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {schedule.employee.profile.full_name} • {schedule.office.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getShiftTypeIcon(schedule.shift_type)}
                          <span className="ml-1">{schedule.shift_type}</span>
                        </Badge>
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => handleStatusToggle('Schedule', schedule.id, schedule.is_active)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{schedule.start_time} - {schedule.end_time}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schedule.work_days.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs capitalize">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Control
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAccessControls.map((access) => (
                  <div key={access.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{access.employee.profile.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {access.employee.profile.email} • {access.office.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getAccessLevelColor(access.access_level)}>
                          {getAccessLevelIcon(access.access_level)}
                          <span className="ml-1">{access.access_level.replace('_', ' ')}</span>
                        </Badge>
                        <Switch
                          checked={access.is_active}
                          onCheckedChange={() => handleStatusToggle('Access Control', access.id, access.is_active)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {access.allowed_areas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area.replace('_', ' ')}
                          </Badge>
                        ))}
                        {access.allowed_areas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{access.allowed_areas.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          {access.ip_override ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                          )}
                          <span>IP Override</span>
                        </div>
                        {access.office.settings.require_ip_whitelist && (
                          <Badge variant="outline" className="text-xs">
                            <Wifi className="h-3 w-3 mr-1" />
                            IP Restricted
                          </Badge>
                        )}
                        {access.office.settings.geo_fencing_enabled && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Geo Fencing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
