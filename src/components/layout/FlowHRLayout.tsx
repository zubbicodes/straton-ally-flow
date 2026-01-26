import { Outlet } from 'react-router-dom';
import { FlowHRSidebar } from './FlowHRSidebar';
import { BottomNav } from './BottomNav';

export function FlowHRLayout() {
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <FlowHRSidebar />
      </div>
      
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto pb-20 md:pb-6">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
