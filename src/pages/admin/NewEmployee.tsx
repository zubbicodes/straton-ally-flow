import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createUserAsAdmin } from '@/lib/auth-service';
import { supabase } from '@/integrations/supabase/client';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email username is required')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid email username format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['admin', 'employee']),
  salaryType: z.enum(['monthly', 'hourly']).optional(),
  salaryAmount: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Department {
  id: string;
  name: string;
}

export default function NewEmployee() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'employee',
      joiningDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedRole = watch('role');

  // Generate employee ID when role changes
  useEffect(() => {
    const generateEmployeeId = async () => {
      try {
        const prefix = selectedRole === 'admin' ? 'SAADM' : 'SAEMP';
        
        // Get the latest employee ID for this role
        const { data: latestEmployee } = await supabase
          .from('employees')
          .select('employee_id')
          .like('employee_id', `${prefix}%`)
          .order('employee_id', { ascending: false })
          .limit(1)
          .single();

        let newId = `${prefix}001`;
        if (latestEmployee?.employee_id) {
          const currentNumber = parseInt(latestEmployee.employee_id.replace(prefix, ''));
          newId = `${prefix}${String(currentNumber + 1).padStart(3, '0')}`;
        }

        setGeneratedEmployeeId(newId);
      } catch (error) {
        // If no employees exist yet, start with 001
        const prefix = selectedRole === 'admin' ? 'SAADM' : 'SAEMP';
        setGeneratedEmployeeId(`${prefix}001`);
      }
    };

    generateEmployeeId();
  }, [selectedRole]);

  useEffect(() => {
    async function fetchDepartments() {
      const { data } = await supabase.from('departments').select('id, name').order('name');
      if (data) setDepartments(data);
    }
    fetchDepartments();
  }, []);

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    
    try {
      // Create auth user using admin service
      const user = await createUserAsAdmin({
        email: `${data.email}@stratonally.com`,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      });

      const userId = user.id;

      // Update profile with full name
      await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('id', userId);

      // Assign role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: data.role,
      });

      if (roleError) throw roleError;

      // Create employee record with generated ID
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .insert({
          user_id: userId,
          employee_id: generatedEmployeeId,
          department_id: data.departmentId || null,
          designation: data.designation || null,
          joining_date: data.joiningDate,
          phone: data.phone || null,
          address: data.address || null,
        })
        .select()
        .single();

      if (empError) throw empError;

      // Create salary record if provided
      if (data.salaryAmount && data.salaryType) {
        await supabase.from('salaries').insert({
          employee_id: employeeData.id,
          salary_type: data.salaryType,
          amount: parseFloat(data.salaryAmount),
          effective_date: data.joiningDate,
        });
      }

      toast({
        title: 'Employee created',
        description: `${data.fullName} (${generatedEmployeeId}) has been added successfully`,
      });

      navigate('/admin/employees');
    } catch (error: unknown) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create employee',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Add New Employee</h1>
          <p className="text-muted-foreground mt-1">Create a new employee account and profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Employee's personal and account details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register('fullName')}
                className="h-11"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Username *</Label>
              <div className="flex">
                <Input
                  id="email"
                  placeholder="john.doe"
                  {...register('email')}
                  className="h-11 rounded-r-none"
                />
                <div className="flex items-center px-3 h-11 border border-l-0 border-input bg-muted rounded-r-md text-sm text-muted-foreground">
                  @stratonally.com
                </div>
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={generatedEmployeeId}
                disabled
                className="h-11 bg-muted"
              />
              <p className="text-xs text-muted-foreground">Auto-generated based on role</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                {...register('password')}
                className="h-11"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 890"
                {...register('phone')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue('role', value as 'admin' | 'employee')}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Department, designation, and joining details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select onValueChange={(value) => setValue('departmentId', value)}>
                <SelectTrigger className="h-11">
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
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                placeholder="Software Engineer"
                {...register('designation')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input
                id="joiningDate"
                type="date"
                {...register('joiningDate')}
                className="h-11"
              />
              {errors.joiningDate && (
                <p className="text-sm text-destructive">{errors.joiningDate.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Full address"
                {...register('address')}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
            <CardDescription>Optional: Set initial salary details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salaryType">Salary Type</Label>
              <Select onValueChange={(value) => setValue('salaryType', value as 'monthly' | 'hourly')}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryAmount">Amount</Label>
              <Input
                id="salaryAmount"
                type="number"
                placeholder="0.00"
                {...register('salaryAmount')}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Create Employee
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
