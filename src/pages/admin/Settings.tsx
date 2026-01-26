import { Settings as SettingsIcon, Building2, User, Bell, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system and account settings</p>
      </div>

      {/* Profile Settings */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user?.fullName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" disabled>
              Update Profile (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </CardTitle>
          <CardDescription>Organization-wide configurations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value="STRATON ALLY" disabled />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value="@stratonally.com" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email for important updates
              </p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Employee Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new employees are added
              </p>
            </div>
            <Switch disabled />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Leave Request Alerts</p>
              <p className="text-sm text-muted-foreground">
                Notifications for pending leave requests
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Security and authentication settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable (Coming Soon)
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Management</p>
              <p className="text-sm text-muted-foreground">
                View and manage active sessions
              </p>
            </div>
            <Button variant="outline" disabled>
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform</p>
              <p className="font-medium">FLOW</p>
            </div>
            <div>
              <p className="text-muted-foreground">Backend</p>
              <p className="font-medium">Lovable Cloud</p>
            </div>
            <div>
              <p className="text-muted-foreground">Environment</p>
              <p className="font-medium">Production</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
