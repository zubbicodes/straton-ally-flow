import { TaskManagement } from '@/components/employee/TaskManagement';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Manage your tasks and track progress</p>
      </div>
      <TaskManagement />
    </div>
  );
}
