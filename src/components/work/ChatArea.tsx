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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  attachments?: unknown;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

type RawMessage = Omit<Message, 'user'>;

interface TaskAttachmentUser {
  id: string;
  full_name: string;
  email?: string;
  avatar_url: string | null;
}

interface TaskAttachmentPayload {
  type: 'task';
  task: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
  };
  tagged_users?: TaskAttachmentUser[];
}

const isTaskAttachmentPayload = (value: unknown): value is TaskAttachmentPayload => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.type !== 'task') return false;
  const task = v.task;
  if (!task || typeof task !== 'object') return false;
  const t = task as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.title === 'string' && typeof t.priority === 'string' && typeof t.status === 'string';
};

const getTaskAttachment = (attachments: unknown): TaskAttachmentPayload | null => {
  if (!Array.isArray(attachments)) return null;
  const found = attachments.find(isTaskAttachmentPayload);
  return found || null;
};

interface ChatAreaProps {
  channelId: string;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [mentionCandidates, setMentionCandidates] = useState<TaskAttachmentUser[]>([]);
  const mentionCandidatesRef = useRef<TaskAttachmentUser[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  useEffect(() => {
    const fetchChannelProfiles = async () => {
      const { data, error } = await supabase.rpc('get_channel_profiles', { _channel_id: channelId });
      if (error) {
        console.error('Error fetching channel profiles:', error);
        setMentionCandidates([]);
        mentionCandidatesRef.current = [];
        return [];
      }

      const candidates: TaskAttachmentUser[] = (data || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url ?? null,
      }));

      setMentionCandidates(candidates);
      mentionCandidatesRef.current = candidates;
      return candidates;
    };

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_messages')
        .select('id,content,user_id,created_at,attachments')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
      } else {
        const rows = (data || []) as RawMessage[];
        const candidates = mentionCandidatesRef.current.length > 0 ? mentionCandidatesRef.current : await fetchChannelProfiles();
        const profileById = candidates.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, TaskAttachmentUser>);

        const messagesWithProfiles = rows.map((m) => ({
          ...m,
          user: profileById[m.user_id] || { full_name: 'Unknown User', avatar_url: '' }
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
            const cached = mentionCandidatesRef.current.find((p) => p.id === payload.new.user_id);

            const newMessage = {
              ...payload.new,
              user: cached || { full_name: 'Unknown User', avatar_url: '' }
            } as Message;

            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe();

      return channel;
    };

    fetchChannelProfiles();
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

  const getMentionState = (text: string, cursorIndex: number) => {
    const beforeCursor = text.slice(0, cursorIndex);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return null;
    const prevChar = atIndex > 0 ? beforeCursor[atIndex - 1] : '';
    if (prevChar && !/\s/.test(prevChar)) return null;
    const token = beforeCursor.slice(atIndex + 1);
    if (/\s/.test(token)) return null;
    return { atIndex, query: token };
  };

  const filteredMentionCandidates = mentionCandidates.filter((c) => {
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.email ? c.email.toLowerCase().includes(q) : false)
    );
  });

  const applyMention = (candidate: TaskAttachmentUser) => {
    const input = inputRef.current;
    if (!input) return;
    if (mentionStartIndex === null) return;

    const cursor = input.selectionStart ?? newMessage.length;
    const before = newMessage.slice(0, mentionStartIndex);
    const after = newMessage.slice(cursor);
    const insert = `@${candidate.full_name} `;
    const next = `${before}${insert}${after}`;
    const nextCursor = (before + insert).length;

    setNewMessage(next);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    setActiveMentionIndex(0);

    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const renderTaskCard = (taskPayload: TaskAttachmentPayload) => {
    const task = taskPayload.task;
    const taggedUsers = taskPayload.tagged_users || [];
    return (
      <Card className="border-muted bg-muted/20">
        <CardHeader className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{task.title}</CardTitle>
              {task.description && (
                <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {task.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-[10px] h-5">{task.status}</Badge>
              <Badge variant="outline" className="text-[10px] h-5">{task.priority}</Badge>
            </div>
          </div>
          {task.due_date && (
            <div className="text-xs text-muted-foreground mt-2">
              Due {format(new Date(task.due_date), 'PP')}
            </div>
          )}
        </CardHeader>
        {taggedUsers.length > 0 && (
          <CardContent className="pt-0 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {taggedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 bg-background/60 border rounded-full px-2 py-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">@{u.full_name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
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
                    {getTaskAttachment(message.attachments) ? (
                      <div className="space-y-2">
                        {renderTaskCard(getTaskAttachment(message.attachments)!)}
                        {message.content ? (
                          <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="relative flex gap-2 bg-muted/30 p-2 rounded-lg border focus-within:ring-1 focus-within:ring-ring">
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
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              const next = e.target.value;
              setNewMessage(next);
              const cursor = e.target.selectionStart ?? next.length;
              const state = getMentionState(next, cursor);
              if (!state) {
                setMentionOpen(false);
                setMentionQuery('');
                setMentionStartIndex(null);
                setActiveMentionIndex(0);
                return;
              }
              setMentionOpen(true);
              setMentionQuery(state.query);
              setMentionStartIndex(state.atIndex);
              setActiveMentionIndex(0);
            }}
            onKeyDown={(e) => {
              if (!mentionOpen) return;
              if (filteredMentionCandidates.length === 0) return;

              if (e.key === 'Escape') {
                e.preventDefault();
                setMentionOpen(false);
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveMentionIndex((prev) => Math.min(prev + 1, filteredMentionCandidates.length - 1));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveMentionIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                applyMention(filteredMentionCandidates[activeMentionIndex]);
              }
            }}
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

          {mentionOpen && (
            <div className="absolute left-[140px] right-2 bottom-[54px] z-50 border rounded-md bg-background shadow-md overflow-hidden">
              <ScrollArea className="max-h-[220px]">
                {filteredMentionCandidates.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No matches</div>
                ) : (
                  <div className="divide-y">
                    {filteredMentionCandidates.slice(0, 12).map((c, idx) => (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyMention(c);
                        }}
                        className={`flex items-center gap-3 p-3 cursor-pointer ${idx === activeMentionIndex ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={c.avatar_url || undefined} />
                          <AvatarFallback>{c.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{c.full_name}</span>
                          {c.email ? <span className="text-xs text-muted-foreground truncate">{c.email}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
