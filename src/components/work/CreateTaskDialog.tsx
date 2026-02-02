import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface CreateTaskDialogProps {
  channelId: string;
  trigger?: React.ReactNode;
  onTaskCreated?: () => void;
}

interface TaskFormValues {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
}

interface OfficeEmployeeOption {
  employee_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export function CreateTaskDialog({ channelId, trigger, onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<OfficeEmployeeOption[]>([]);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const { register, handleSubmit, reset, setValue } = useForm<TaskFormValues>({
    defaultValues: {
      priority: 'medium',
      status: 'todo'
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const fetchOptions = async () => {
      const { data: channelRow, error: channelError } = await supabase
        .from('work_channels')
        .select('office_id')
        .eq('id', channelId)
        .single();

      if (channelError) {
        console.error('Error fetching channel office:', channelError);
        setEmployeeOptions([]);
        return;
      }

      const officeId = channelRow?.office_id;
      if (!officeId) {
        setEmployeeOptions([]);
        return;
      }

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id,user_id')
        .eq('office_id', officeId);

      if (employeesError) {
        console.error('Error fetching office employees:', employeesError);
        setEmployeeOptions([]);
        return;
      }

      const userIds = (employeesData || []).map((e) => e.user_id).filter(Boolean);
      if (userIds.length === 0) {
        setEmployeeOptions([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id,full_name,email,avatar_url')
        .in('id', userIds)
        .order('full_name', { ascending: true });

      if (profilesError) {
        console.error('Error fetching profiles for task tagging:', profilesError);
        setEmployeeOptions([]);
        return;
      }

      const merged: OfficeEmployeeOption[] = (employeesData || []).map((e) => {
        const p = (profilesData || []).find((x) => x.id === e.user_id);
        return {
          employee_id: e.id,
          user_id: e.user_id,
          full_name: p?.full_name || 'Unknown User',
          email: p?.email || '',
          avatar_url: p?.avatar_url ?? null,
        };
      });

      setEmployeeOptions(merged);
    };

    fetchOptions();
  }, [open, channelId]);

  const onSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: createdTask, error } = await supabase.from('work_tasks').insert({
        channel_id: channelId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        creator_id: user.id,
        due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }).select('id,channel_id,title,description,priority,status,due_date,creator_id,assignee_id,created_at').single();

      if (error) throw error;

      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });

      const taggedUsers = employeeOptions
        .filter((e) => taggedUserIds.includes(e.user_id))
        .map((e) => ({
          id: e.user_id,
          full_name: e.full_name,
          email: e.email,
          avatar_url: e.avatar_url,
        }));

      // Also post a system message to the chat
      await supabase.from('work_messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: `Created a new task: ${data.title}`,
        attachments: [
          {
            type: 'task',
            task: createdTask,
            tagged_users: taggedUsers,
          },
        ],
      });

      setOpen(false);
      reset();
      setTaggedUserIds([]);
      onTaskCreated?.();
    } catch (error: unknown) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaggedUser = (userId: string) => {
    setTaggedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CheckSquare className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to this channel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Task title" {...register('title', { required: true })} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Task details..." {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(val) => setValue('priority', val)} defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tag users</Label>
              {taggedUserIds.length > 0 && (
                <Badge variant="secondary">{taggedUserIds.length} selected</Badge>
              )}
            </div>
            <div className="border rounded-md h-[180px] overflow-hidden">
              <ScrollArea className="h-full">
                {employeeOptions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No employees found</div>
                ) : (
                  <div className="divide-y">
                    {employeeOptions.map((opt) => (
                      <button
                        key={opt.user_id}
                        type="button"
                        onClick={() => toggleTaggedUser(opt.user_id)}
                        className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/50 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={opt.avatar_url || undefined} />
                            <AvatarFallback>{opt.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{opt.full_name}</span>
                            <span className="text-xs text-muted-foreground truncate">{opt.email}</span>
                          </div>
                        </div>
                        <Checkbox checked={taggedUserIds.includes(opt.user_id)} />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
