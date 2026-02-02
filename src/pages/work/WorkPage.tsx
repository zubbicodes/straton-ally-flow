import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChatArea } from '@/components/work/ChatArea';
import { Hash, Volume2, Megaphone, Users, Search, Bell, Pin, HelpCircle, Inbox, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Channel {
  id: string;
  name: string;
  type: string;
  description: string;
}

export default function WorkPage() {
  const { channelId } = useParams();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchChannelDetails(channelId);
    } else {
      setChannel(null);
    }
  }, [channelId]);

  const fetchChannelDetails = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('work_channels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setChannel(data as unknown as Channel);
    }
    setLoading(false);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Volume2 className="w-5 h-5 text-muted-foreground" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-muted-foreground" />;
      default: return <Hash className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (!channelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <div className="bg-muted/30 p-6 rounded-full mb-4">
          <Layout className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Welcome to Work Module</h2>
        <p>Select an office and channel to start collaborating.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Channel Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 overflow-hidden">
          {channel && getChannelIcon(channel.type)}
          <div className="flex flex-col min-w-0">
            <h1 className="font-semibold text-sm truncate">{channel?.name || 'Loading...'}</h1>
            {channel?.description && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline-block">
                {channel.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Header Actions */}
           <div className="hidden md:flex items-center gap-1">
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Threads">
               <Hash className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Notification Settings">
               <Bell className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Pinned Messages">
               <Pin className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Member List">
               <Users className="w-4 h-4" />
             </Button>
           </div>
           
           <div className="relative w-40 md:w-60 ml-2">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search" 
               className="pl-8 h-8 text-sm bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all" 
             />
           </div>

           <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden">
             <Inbox className="w-5 h-5" />
           </Button>
        </div>
      </header>

      {/* Main Content (Chat) */}
      <main className="flex-1 min-h-0">
        <ChatArea channelId={channelId} />
      </main>
    </div>
  );
}
