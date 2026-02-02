import { Outlet } from 'react-router-dom';
import { WorkSidebar } from './WorkSidebar';

export function WorkLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
