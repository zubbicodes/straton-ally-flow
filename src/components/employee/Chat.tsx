import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  message: string;
  timestamp: string;
  is_own: boolean;
  type: 'text' | 'file' | 'image';
  file_name?: string;
  file_size?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
  avatar?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy';
  last_seen: string;
}

const mockChatRooms: ChatRoom[] = [
  {
    id: '1',
    name: 'John Doe',
    type: 'direct',
    participants: ['1', '2'],
    last_message: 'Sure, I\'ll review the design mockups by end of day.',
    last_message_time: '2024-01-28T10:30:00Z',
    unread_count: 2,
    is_online: true,
    avatar: 'JD'
  },
  {
    id: '2',
    name: 'Design Team',
    type: 'group',
    participants: ['1', '2', '3', '4'],
    last_message: 'Jane Smith: The new landing page designs are ready for review',
    last_message_time: '2024-01-28T09:15:00Z',
    unread_count: 5,
    avatar: 'DT'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    type: 'direct',
    participants: ['1', '3'],
    last_message: 'Can we schedule a quick sync about the project timeline?',
    last_message_time: '2024-01-27T16:45:00Z',
    unread_count: 0,
    is_online: false,
    avatar: 'MJ'
  },
  {
    id: '4',
    name: 'Engineering Team',
    type: 'group',
    participants: ['1', '3', '4', '5', '6'],
    last_message: 'Sarah Wilson: Database migration completed successfully',
    last_message_time: '2024-01-27T14:20:00Z',
    unread_count: 1,
    avatar: 'ET'
  }
];

const mockMessages: { [key: string]: ChatMessage[] } = {
  '1': [
    {
      id: '1',
      sender_id: '2',
      sender_name: 'John Doe',
      sender_avatar: 'JD',
      message: 'Hey! How are the new designs coming along?',
      timestamp: '2024-01-28T09:00:00Z',
      is_own: false,
      type: 'text'
    },
    {
      id: '2',
      sender_id: '1',
      sender_name: 'You',
      sender_avatar: 'ME',
      message: 'They\'re progressing well! I should have the mockups ready by afternoon.',
      timestamp: '2024-01-28T09:15:00Z',
      is_own: true,
      type: 'text'
    },
    {
      id: '3',
      sender_id: '2',
      sender_name: 'John Doe',
      sender_avatar: 'JD',
      message: 'Great! Can you share them with me once they\'re ready?',
      timestamp: '2024-01-28T10:00:00Z',
      is_own: false,
      type: 'text'
    },
    {
      id: '4',
      sender_id: '1',
      sender_name: 'You',
      sender_avatar: 'ME',
      message: 'Sure, I\'ll review the design mockups by end of day.',
      timestamp: '2024-01-28T10:30:00Z',
      is_own: true,
      type: 'text'
    }
  ],
  '2': [
    {
      id: '1',
      sender_id: '2',
      sender_name: 'Jane Smith',
      sender_avatar: 'JS',
      message: 'Hi team! The new landing page designs are ready for review',
      timestamp: '2024-01-28T09:15:00Z',
      is_own: false,
      type: 'text'
    },
    {
      id: '2',
      sender_id: '3',
      sender_name: 'Mike Johnson',
      sender_avatar: 'MJ',
      message: 'Excellent work Jane! I\'ll review them this morning.',
      timestamp: '2024-01-28T09:30:00Z',
      is_own: false,
      type: 'text'
    }
  ]
};

const mockOnlineUsers: OnlineUser[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'JD',
    status: 'online',
    last_seen: '2024-01-28T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'JS',
    status: 'online',
    last_seen: '2024-01-28T10:25:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'MJ',
    status: 'away',
    last_seen: '2024-01-28T09:45:00Z'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    avatar: 'SW',
    status: 'busy',
    last_seen: '2024-01-28T08:30:00Z'
  }
];

export function Chat() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(mockChatRooms);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(mockOnlineUsers);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedRoom) {
      setMessages(mockMessages[selectedRoom.id] || []);
      // Mark messages as read
      setChatRooms(rooms => 
        rooms.map(room => 
          room.id === selectedRoom.id 
            ? { ...room, unread_count: 0 }
            : room
        )
      );
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: OnlineUser['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: OnlineUser['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  const filteredChatRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender_id: '1',
      sender_name: 'You',
      sender_avatar: 'ME',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_own: true,
      type: 'text'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Update last message in chat room
    setChatRooms(rooms =>
      rooms.map(room =>
        room.id === selectedRoom.id
          ? { ...room, last_message: message.message, last_message_time: message.timestamp }
          : room
      )
    );

    // Simulate response after 1 second
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender_id: selectedRoom.type === 'direct' ? selectedRoom.participants.find(p => p !== '1') || '2' : '2',
        sender_name: selectedRoom.type === 'direct' ? selectedRoom.name : 'Team Member',
        sender_avatar: selectedRoom.type === 'direct' ? selectedRoom.avatar || 'TM' : 'TM',
        message: 'Thanks for your message! I\'ll get back to you soon.',
        timestamp: new Date().toISOString(),
        is_own: false,
        type: 'text'
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const ChatRoomList = () => (
    <div className="space-y-2">
      {filteredChatRooms.map(room => (
        <Card
          key={room.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selectedRoom?.id === room.id ? 'bg-accent' : ''
          }`}
          onClick={() => setSelectedRoom(room)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                    {room.avatar || room.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {room.type === 'direct' && room.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium truncate">{room.name}</h4>
                  {room.unread_count > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {room.unread_count}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {room.last_message}
                  </p>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(room.last_message_time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <div className={`flex ${message.is_own ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.is_own ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[70%]`}>
        {!message.is_own && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {message.sender_avatar}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`${message.is_own ? 'items-end' : 'items-start'} flex flex-col`}>
          {!message.is_own && (
            <p className="text-xs text-muted-foreground mb-1">{message.sender_name}</p>
          )}
          
          <div
            className={`rounded-lg px-3 py-2 ${
              message.is_own
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {message.type === 'text' && (
              <p className="text-sm">{message.message}</p>
            )}
            {message.type === 'file' && (
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{message.file_name}</p>
                  <p className="text-xs opacity-70">{message.file_size}</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.timestamp), 'h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[600px] flex">
      {/* Chat Rooms Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Messages</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <ChatRoomList />
            </div>
          </ScrollArea>
        </div>
        
        {/* Online Users */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
          >
            <Users className="h-4 w-4 mr-2" />
            Online Users ({onlineUsers.filter(u => u.status === 'online').length})
          </Button>
          
          {showOnlineUsers && (
            <div className="mt-2 space-y-2">
              {onlineUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{getStatusText(user.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {selectedRoom.avatar || selectedRoom.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedRoom.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.type === 'group' 
                        ? `${selectedRoom.participants.length} participants`
                        : selectedRoom.is_online 
                          ? 'Online' 
                          : 'Offline'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View Info</DropdownMenuItem>
                      <DropdownMenuItem>Search Messages</DropdownMenuItem>
                      <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Leave Chat</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
