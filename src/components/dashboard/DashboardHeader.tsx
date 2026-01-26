import { Search, Bell, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
}

export function DashboardHeader({ userName, userRole = 'HR Executive' }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Admin';

  return (
    <header className="flex flex-col gap-4 pb-4 md:pb-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Navigation Tabs - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="default" size="sm" className="bg-success text-success-foreground hover:bg-success/90">
            Overview
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Recruitment
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Attendance
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Payroll Management
          </Button>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="w-[180px] pl-9 h-9 text-sm bg-secondary/50 border-border focus-visible:ring-1"
            />
          </div>
          
          {/* Actions */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full" />
          </Button>
          
          <ThemeToggle />
          
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-success text-success-foreground text-sm font-medium">
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">
            Hello, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready to streamline your HR tasks and boost productivity?
          </p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            Add Attendance
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Update Payroll
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            New Task
          </Button>
        </div>
      </div>
    </header>
  );
}
