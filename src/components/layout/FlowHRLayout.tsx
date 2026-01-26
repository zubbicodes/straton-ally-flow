import { Outlet } from 'react-router-dom';
import { FlowHRSidebar } from './FlowHRSidebar';

export function FlowHRLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <FlowHRSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
