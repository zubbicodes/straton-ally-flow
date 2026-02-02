import { useState } from 'react';
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

export function CreateTaskDialog({ channelId, trigger, onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<TaskFormValues>({
    defaultValues: {
      priority: 'medium',
      status: 'todo'
    }
  });
  const { toast } = useToast();

  const onSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('work_tasks').insert({
        channel_id: channelId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        creator_id: user.id,
        due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      });

      if (error) throw error;

      toast({
        title: "Task created",
        description: "The task has been successfully created.",
      });

      // Also post a system message to the chat
      await supabase.from('work_messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: `Created a new task: **${data.title}** (${data.priority})`,
        // type: 'system' // If we had a type column, but we can just use text for now
      });

      setOpen(false);
      reset();
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
