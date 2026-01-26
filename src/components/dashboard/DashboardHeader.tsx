import { Search, Settings, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
}

export function DashboardHeader({ userName, userRole = 'HR Executive' }: DashboardHeaderProps) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning,' : currentHour < 18 ? 'Good Afternoon,' : 'Good Evening,';
  const firstName = userName?.split(' ')[0] || 'Admin';

  return (
    <header className="flex items-center justify-between pb-6">
      <div>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="text-xl font-bold tracking-tight">
          {firstName}. <span className="font-normal text-muted-foreground text-base">{userRole}</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search anything"
            className="w-[200px] pl-9 h-9 text-sm bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {firstName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
