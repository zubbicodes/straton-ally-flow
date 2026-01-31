import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  Search,
  MoreHorizontal,
  User,
  Building2,
  Wifi,
  WifiOff,
  MapPin,
  Edit,
  Trash2,
  Key,
  Lock,
  Unlock,
  Clock,
  Calendar,
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AccessControl {
  id: string;
  employee_id: string;
  office_id: string;
  access_level: 'full' | 'restricted' | 'read_only';
  allowed_areas: string[];
  time_restrictions: Record<string, { start: string; end: string }> | null;
  ip_override: boolean;
  is_active: boolean;
  effective_date: string;
  expiry_date: string | null;
  created_at: string;
  employee: {
    employee_id: string;
    profile: {
      full_name: string;
      email: string;
    };
  };
  office: {
    name: string;
    settings: {
      require_ip_whitelist: boolean;
      geo_fencing_enabled: boolean;
    };
  };
}

export default function AccessControl() {
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccessControls = async () => {
    try {
      // Mock data for now - in real implementation this would fetch from database
      const mockAccessControls: AccessControl[] = [
        {
          id: '1',
          employee_id: '1',
          office_id: '1',
          access_level: 'full',
          allowed_areas: ['main_office', 'server_room', 'conference_rooms'],
          time_restrictions: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
          },
          ip_override: true,
          is_active: true,
          effective_date: '2024-01-01',
          expiry_date: null,
          created_at: new Date().toISOString(),
          employee: {
            employee_id: 'EMP001',
            profile: {
              full_name: 'John Doe',
              email: 'john@example.com',
            },
          },
          office: {
            name: 'Headquarters',
            settings: {
              require_ip_whitelist: false,
              geo_fencing_enabled: false,
            },
          },
        },
        {
          id: '2',
          employee_id: '2',
          office_id: '1',
          access_level: 'restricted',
          allowed_areas: ['main_office', 'break_room'],
          time_restrictions: {
            monday: { start: '08:00', end: '16:00' },
            tuesday: { start: '08:00', end: '16:00' },
            wednesday: { start: '08:00', end: '16:00' },
            thursday: { start: '08:00', end: '16:00' },
            friday: { start: '08:00', end: '16:00' },
          },
          ip_override: false,
          is_active: true,
          effective_date: '2024-01-01',
          expiry_date: null,
          created_at: new Date().toISOString(),
          employee: {
            employee_id: 'EMP002',
            profile: {
              full_name: 'Jane Smith',
              email: 'jane@example.com',
            },
          },
          office: {
            name: 'Headquarters',
            settings: {
              require_ip_whitelist: true,
              geo_fencing_enabled: true,
            },
          },
        },
      ];

      setAccessControls(mockAccessControls);
    } catch (error) {
      console.error('Error fetching access controls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch access controls',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessControls();
  }, []);

  const filteredAccessControls = accessControls.filter((access) =>
    access.employee.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    access.employee.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    access.office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    access.access_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (accessId: string, currentStatus: boolean) => {
    try {
      // Mock update - in real implementation this would update the database
      toast({
        title: 'Access updated',
        description: `Access has been ${!currentStatus ? 'granted' : 'revoked'}`,
      });
      fetchAccessControls();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update access control',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (accessId: string) => {
    if (!confirm('Are you sure you want to remove this access control?')) return;

    try {
      // Mock delete - in real implementation this would delete from database
      toast({
        title: 'Access control removed',
        description: 'Access control has been removed successfully',
      });
      fetchAccessControls();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove access control',
        variant: 'destructive',
      });
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'badge-success';
      case 'restricted':
        return 'badge-warning';
      case 'read_only':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'full':
        return <Unlock className="h-4 w-4" />;
      case 'restricted':
        return <Lock className="h-4 w-4" />;
      case 'read_only':
        return <Key className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Access Control</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee access permissions and security settings
          </p>
        </div>
        <Link to="/admin/access-control/new">
          <Button variant="accent" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Grant Access
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
                placeholder="Search access controls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredAccessControls.length} access rules
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Access Controls Table */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredAccessControls.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No access controls found</p>
              <Link to="/admin/access-control/new" className="mt-4 inline-block">
                <Button variant="outline">Grant your first access</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Allowed Areas</TableHead>
                  <TableHead>Security</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccessControls.map((access) => (
                  <TableRow key={access.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <p className="font-medium">{access.employee.profile.full_name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{access.employee.profile.email}</p>
                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                          {access.employee.employee_id}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{access.office.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getAccessLevelColor(access.access_level)}>
                          {getAccessLevelIcon(access.access_level)}
                          <span className="ml-1">{access.access_level.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {access.allowed_areas.slice(0, 2).map((area) => (
                          <Badge key={area} variant="outline" className="text-xs">
                            {area.replace('_', ' ')}
                          </Badge>
                        ))}
                        {access.allowed_areas.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{access.allowed_areas.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {access.ip_override ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">IP Override</span>
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
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {format(new Date(access.effective_date), 'MMM d, yyyy')}
                        </div>
                        {access.expiry_date && (
                          <div className="text-xs text-muted-foreground">
                            to {format(new Date(access.expiry_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            access.is_active ? 'badge-success' : 'badge-destructive'
                          }
                        >
                          {access.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={access.is_active}
                          onCheckedChange={() => handleStatusToggle(access.id, access.is_active)}
                        />
                      </div>
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
                            <Link to={`/admin/access-control/${access.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Access
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/access-control/${access.id}/logs`}>
                              <Clock className="h-4 w-4 mr-2" />
                              View Logs
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(access.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Access
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
