import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Admin';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Ready to streamline your HR tasks and boost productivity?
        </p>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Add Attendance
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Update Payroll
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          New Task
        </Button>
      </div>
    </header>
  );
}
