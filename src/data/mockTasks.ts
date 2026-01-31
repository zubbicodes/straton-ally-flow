export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  project: string;
  estimated_hours?: number;
  actual_hours?: number;
};

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create mockups and wireframes for the new marketing landing page',
    status: 'in_progress',
    priority: 'high',
    assignee: 'John Doe',
    due_date: '2024-02-15',
    created_at: '2024-01-20',
    updated_at: '2024-01-25',
    tags: ['design', 'marketing'],
    project: 'Website Redesign',
    estimated_hours: 16,
    actual_hours: 8,
  },
  {
    id: '2',
    title: 'Fix authentication bug',
    description: 'Users are reporting login issues on mobile devices',
    status: 'todo',
    priority: 'urgent',
    assignee: 'Jane Smith',
    due_date: '2024-01-30',
    created_at: '2024-01-25',
    updated_at: '2024-01-25',
    tags: ['bug', 'mobile'],
    project: 'Platform Maintenance',
    estimated_hours: 4,
    actual_hours: 0,
  },
  {
    id: '3',
    title: 'Update documentation',
    description: 'Update API documentation for new endpoints',
    status: 'review',
    priority: 'medium',
    assignee: 'Mike Johnson',
    due_date: '2024-02-01',
    created_at: '2024-01-15',
    updated_at: '2024-01-28',
    tags: ['documentation'],
    project: 'API Development',
    estimated_hours: 8,
    actual_hours: 6,
  },
  {
    id: '4',
    title: 'Database optimization',
    description: 'Optimize slow queries in the reporting module',
    status: 'completed',
    priority: 'medium',
    assignee: 'Sarah Wilson',
    due_date: '2024-01-25',
    created_at: '2024-01-10',
    updated_at: '2024-01-24',
    tags: ['database', 'performance'],
    project: 'Performance Optimization',
    estimated_hours: 12,
    actual_hours: 10,
  },
];
