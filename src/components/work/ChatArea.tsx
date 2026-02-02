import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Smile, MoreVertical, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CreateTaskDialog } from './CreateTaskDialog';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

type RawMessage = Omit<Message, 'user'>;

interface ChatAreaProps {
  channelId: string;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_messages')
        .select('id,content,user_id,created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
      } else {
        const rows = (data || []) as RawMessage[];
        const userIds = Array.from(new Set(rows.map((m) => m.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        const messagesWithProfiles = rows.map((m) => ({
          ...m,
          user: profiles?.find((p) => p.id === m.user_id) || { full_name: 'Unknown User', avatar_url: '' }
        }));
        
        setMessages(messagesWithProfiles);
      }
      setLoading(false);
    };

    const subscribeToMessages = () => {
      const channel = supabase
        .channel(`room:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'work_messages',
            filter: `channel_id=eq.${channelId}`,
          },
          async (payload) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newMessage = {
              ...payload.new,
              user: profile || { full_name: 'Unknown User', avatar_url: '' }
            } as Message;

            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe();

      return channel;
    };

    fetchMessages();
    const channel = subscribeToMessages();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('work_messages').insert({
      channel_id: channelId,
      user_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const isSameUser = index > 0 && messages[index - 1].user_id === message.user_id;
              return (
                <div key={message.id} className={`flex gap-3 ${isSameUser ? 'mt-1' : 'mt-4'}`}>
                  {!isSameUser ? (
                    <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={message.user?.avatar_url} />
                      <AvatarFallback>{message.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    {!isSameUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm hover:underline cursor-pointer">
                          {message.user?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2 bg-muted/30 p-2 rounded-lg border focus-within:ring-1 focus-within:ring-ring">
          <div className="flex flex-col justify-end">
            <CreateTaskDialog 
              channelId={channelId} 
              trigger={
                <Button type="button" size="icon" variant="ghost" className="text-muted-foreground shrink-0 rounded-full h-8 w-8 hover:bg-muted">
                  <Plus className="w-5 h-5" />
                </Button>
              }
            />
          </div>
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground shrink-0 self-end mb-1">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channelId}`} // We should pass channel name ideally
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1 h-auto min-h-[40px]"
          />
          <div className="flex items-center gap-1 shrink-0">
             <Button type="button" size="icon" variant="ghost" className="text-muted-foreground">
              <Smile className="w-5 h-5" />
            </Button>
            <Button type="submit" size="icon" disabled={!newMessage.trim()} className={!newMessage.trim() ? "opacity-50" : ""}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
