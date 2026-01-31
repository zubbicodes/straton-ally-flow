import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const employeeSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department_id: z.string().uuid().optional(),
  joining_date: z.string(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Employee {
  id: string;
  employee_id: string;
  user_id: string;
  designation: string | null;
  joining_date: string;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  profile: {
    full_name: string;
    email: string;
    status: string;
    avatar_url: string | null;
  };
  department: {
    id: string;
    name: string;
  } | null;
  access_control: {
    id: string;
    access_level: string;
    office_id: string;
    office: {
      name: string;
    };
  } | null;
  duty_schedule: {
    id: string;
    schedule_name: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    work_days: string[];
  } | null;
}

export default function EditEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!id) return;

      try {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, employee_id, user_id, designation, joining_date, phone, address, emergency_contact, department_id')
          .eq('id', id)
          .single();

        if (employeeError) throw employeeError;

        if (employeeData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email, status, avatar_url')
            .eq('id', employeeData.user_id)
            .single();

          if (profileError) throw profileError;

          const { data: departmentData, error: departmentError } = employeeData.department_id
            ? await supabase.from('departments').select('id, name').eq('id', employeeData.department_id).single()
            : { data: null, error: null };

          if (departmentError) throw departmentError;

          const normalizedEmployee: Employee = {
            id: employeeData.id,
            employee_id: employeeData.employee_id,
            user_id: employeeData.user_id,
            designation: employeeData.designation,
            joining_date: employeeData.joining_date,
            phone: employeeData.phone,
            address: employeeData.address,
            emergency_contact: employeeData.emergency_contact,
            profile: {
              full_name: profileData.full_name,
              email: profileData.email,
              status: profileData.status,
              avatar_url: profileData.avatar_url,
            },
            department: departmentData,
            access_control: null,
            duty_schedule: null,
          };

          setEmployee(normalizedEmployee);
          form.reset({
            full_name: normalizedEmployee.profile.full_name,
            email: normalizedEmployee.profile.email,
            phone: normalizedEmployee.phone || '',
            designation: normalizedEmployee.designation || '',
            department_id: normalizedEmployee.department?.id || '',
            joining_date: normalizedEmployee.joining_date,
            address: normalizedEmployee.address || '',
            emergency_contact: normalizedEmployee.emergency_contact || '',
            status: normalizedEmployee.profile.status as 'active' | 'inactive',
          });
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch employee data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDepartments = async () => {
      const { data } = await supabase.from('departments').select('id, name').order('name');
      setDepartments(data || []);
    };

    const fetchOffices = async () => {
      // Mock offices data - in real implementation this would fetch from database
      const mockOffices = [
        { id: '1', name: 'Headquarters' },
      ];
      setOffices(mockOffices);
    };

    fetchEmployeeData();
    fetchDepartments();
    fetchOffices();
  }, [id, form, toast]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (!id || !employee) return;

    setIsSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          status: data.status,
        })
        .eq('id', employee.user_id);

      if (profileError) throw profileError;

      // Update employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          designation: data.designation,
          department_id: data.department_id || null,
          phone: data.phone,
          address: data.address,
          emergency_contact: data.emergency_contact,
        })
        .eq('id', id);

      if (employeeError) throw employeeError;

      toast({
        title: 'Success',
        description: 'Employee information updated successfully',
      });

      navigate('/admin/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Loading employee data...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Edit Employee</h1>
            <p className="text-muted-foreground mt-1">Update employee information and settings</p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Employee Overview */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.profile.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  {employee.profile.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{employee.profile.full_name}</h3>
                <p className="text-muted-foreground">{employee.profile.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">ID: {employee.employee_id}</Badge>
                  <Badge
                    className={
                      employee.profile.status === 'active'
                        ? 'badge-success'
                        : 'badge-destructive'
                    }
                  >
                    {employee.profile.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  {...form.register('full_name')}
                  placeholder="Enter full name"
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="Enter email address"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  {...form.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  {...form.register('designation')}
                  placeholder="Enter job designation"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.watch('department_id')} onValueChange={(value) => form.setValue('department_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input
                  {...form.register('joining_date')}
                  type="date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                {...form.register('address')}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <Input
                {...form.register('emergency_contact')}
                placeholder="Enter emergency contact information"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.access_control ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">{employee.access_control.office.name}</p>
                    <p className="text-sm text-muted-foreground">Access Level: {employee.access_control.access_level}</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No access control configured</p>
            )}
          </CardContent>
        </Card>

        {/* Duty Schedule */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duty Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.duty_schedule ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">{employee.duty_schedule.schedule_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.duty_schedule.start_time} - {employee.duty_schedule.end_time} ({employee.duty_schedule.shift_type})
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No duty schedule configured</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/employees')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
