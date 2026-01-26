import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/admin/dashboard' },
  { icon: Users, label: 'Team', href: '/admin/employees' },
  { icon: Clock, label: 'Attendance', href: '/admin/attendance' },
  { icon: Wallet, label: 'Payroll', href: '/admin/salaries' },
];

const moreNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: Clock, label: 'Attendance', href: '/admin/attendance' },
  { icon: Wallet, label: 'Payroll', href: '/admin/salaries' },
  { label: 'Performance', href: '/admin/performance' },
  { label: 'Leave Management', href: '/admin/leave' },
  { label: 'Recruitment', href: '/admin/recruitment' },
  { label: 'Settings', href: '/admin/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-success'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-success')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs font-medium text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3">
              {moreNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
