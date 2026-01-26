import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  UserX,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Employee {
  id: string;
  employee_id: string;
  user_id: string;
  designation: string | null;
  joining_date: string;
  phone: string | null;
  profile: {
    full_name: string;
    email: string;
    status: string;
  };
  department: {
    name: string;
  } | null;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          user_id,
          designation,
          joining_date,
          phone,
          departments (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (employeesData) {
        const employeesWithProfiles = await Promise.all(
          employeesData.map(async (emp) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, status')
              .eq('id', emp.user_id)
              .single();

            return {
              ...emp,
              profile: profile || { full_name: 'Unknown', email: '', status: 'active' },
              department: emp.departments as { name: string } | null,
            };
          })
        );
        setEmployees(employeesWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    emp.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Employee has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: 'Employee deleted',
        description: 'Employee record has been removed',
      });
      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their information
          </p>
        </div>
        <Link to="/admin/employees/new">
          <Button variant="accent" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredEmployees.length} employees
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No employees found</p>
              <Link to="/admin/employees/new" className="mt-4 inline-block">
                <Button variant="outline">Add your first employee</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-accent/20 text-accent-foreground">
                            {employee.profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.profile.full_name}</p>
                          <p className="text-sm text-muted-foreground">{employee.profile.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        {employee.employee_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      {employee.department ? (
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          {employee.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{employee.designation || '—'}</TableCell>
                    <TableCell>
                      {format(new Date(employee.joining_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          employee.profile.status === 'active'
                            ? 'badge-success'
                            : 'badge-destructive'
                        }
                      >
                        {employee.profile.status}
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
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/employees/${employee.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusToggle(employee.user_id, employee.profile.status)
                            }
                          >
                            {employee.profile.status === 'active' ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
