import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Clock,
  TrendingUp,
  Wallet,
  CalendarDays,
  UserPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: Clock, label: 'Attendance', href: '/admin/attendance' },
  { icon: TrendingUp, label: 'Performance', href: '/admin/performance' },
  { icon: Wallet, label: 'Payroll', href: '/admin/salaries' },
  { icon: CalendarDays, label: 'Leave Management', href: '/admin/leave' },
  { icon: UserPlus, label: 'Recruitment', href: '/admin/recruitment' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function FlowHRSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen bg-card border-r border-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg tracking-tight">
              Flow<span className="text-success">HR</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-success/10 text-success'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-success')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="font-semibold text-sm mb-1">Upgrade your Plan</p>
          <p className="text-xs text-muted-foreground mb-3">
            Get full control with advanced features and automation
          </p>
          <Button size="sm" className="w-full bg-success hover:bg-success/90 text-white">
            Get FlowHR Pro
          </Button>
        </div>
      )}

      {/* Bottom Items */}
      <div className="px-2 pb-2 border-t border-border pt-2">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-success/10 text-success'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
