import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Admin';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
      {/* Welcome Section */}
      <div>
        <h1 className="text-lg font-display font-bold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-[10px] text-muted-foreground">
          Ready to streamline your HR tasks and boost productivity?
        </p>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
          Add Attendance
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
          Update Payroll
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
          New Task
        </Button>
      </div>
    </header>
  );
}
