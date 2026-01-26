import { Shield, Users, Settings, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const rolePermissions = {
  admin: {
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissions: [
      'View all employees',
      'Manage employees',
      'View all attendance',
      'Manage attendance',
      'View all salaries',
      'Manage salaries',
      'Manage departments',
      'Manage permissions',
      'View login logs',
      'Reset passwords',
      'Lock/unlock accounts',
    ],
  },
  employee: {
    name: 'Employee',
    description: 'Limited access to own data only',
    permissions: [
      'View own profile',
      'Update own profile',
      'View own attendance',
      'View own salary',
      'Request leave',
    ],
  },
};

export default function Permissions() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Permissions</h1>
        <p className="text-muted-foreground mt-1">
          Role-based access control configuration
        </p>
      </div>

      {/* Info Card */}
      <Card className="card-elevated bg-accent/5 border-accent/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium">Secure Role-Based Access</p>
              <p className="text-sm text-muted-foreground">
                Permissions are enforced at the database level using Row Level Security (RLS)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(rolePermissions).map(([role, config]) => (
          <Card key={role} className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  {role === 'admin' ? (
                    <Shield className="h-6 w-6 text-accent" />
                  ) : (
                    <Users className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">{config.name}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Permissions
              </h4>
              <div className="flex flex-wrap gap-2">
                {config.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Future Modules Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Module-Level Access (Coming Soon)
          </CardTitle>
          <CardDescription>
            Fine-grained permissions for individual modules and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['HR Module', 'CRM Module', 'Projects', 'Payroll', 'Reports', 'Settings'].map(
              (module) => (
                <div
                  key={module}
                  className="p-4 rounded-lg bg-secondary/50 text-center"
                >
                  <p className="text-sm font-medium">{module}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    Future
                  </Badge>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
