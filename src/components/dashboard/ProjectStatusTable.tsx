import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  department: string;
  progress: number;
  deadline: string;
  status: 'on-track' | 'in-progress' | 'delayed';
}

interface ProjectStatusTableProps {
  projects: Project[];
}

export function ProjectStatusTable({ projects }: ProjectStatusTableProps) {
  const getStatusBadge = (status: Project['status']) => {
    const config = {
      'on-track': { label: 'On Track', className: 'text-success' },
      'in-progress': { label: 'In Progress', className: 'text-warning' },
      'delayed': { label: 'Delayed', className: 'text-destructive' },
    };
    return config[status];
  };

  return (
    <div className="card-elevated p-3 md:p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Project Status Overview</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Track project completion and department responsibility
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2">
          <Plus className="h-3 w-3" />
          Add Project
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-3 md:mx-0">
        <table className="w-full min-w-[450px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] font-medium text-muted-foreground pb-2 pl-3 md:pl-0">
                Project Name
              </th>
              <th className="text-left text-[10px] font-medium text-muted-foreground pb-2">
                Department
              </th>
              <th className="text-left text-[10px] font-medium text-muted-foreground pb-2">
                Progress
              </th>
              <th className="text-left text-[10px] font-medium text-muted-foreground pb-2">
                Deadline
              </th>
              <th className="text-right text-[10px] font-medium text-muted-foreground pb-2 pr-3 md:pr-0">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const status = getStatusBadge(project.status);
              return (
                <tr key={project.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pl-3 md:pl-0">
                    <span className="text-xs font-medium">{project.name}</span>
                  </td>
                  <td className="py-2">
                    <span className="text-xs text-muted-foreground">{project.department}</span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Progress value={project.progress} className="h-1 w-12" />
                      <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="text-xs text-muted-foreground">{project.deadline}</span>
                  </td>
                  <td className="py-2 pr-3 md:pr-0 text-right">
                    <span className={cn('text-[10px] font-medium flex items-center gap-1 justify-end', status.className)}>
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
