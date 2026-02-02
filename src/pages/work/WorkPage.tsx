import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChatArea } from '@/components/work/ChatArea';
import { Hash, Volume2, Megaphone, Users, Search, Bell, Pin, Inbox, Layout, ArrowLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WorkSidebar } from '@/components/work/WorkSidebar';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  name: string;
  type: string;
  description: string;
}

export default function WorkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { officeId, channelId } = useParams();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [officeName, setOfficeName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (channelId) {
      fetchChannelDetails(channelId);
    } else {
      setChannel(null);
    }
  }, [channelId]);

  useEffect(() => {
    if (!officeId) {
      setOfficeName(null);
      return;
    }

    const fetchOfficeName = async (id: string) => {
      const { data, error } = await supabase.from('offices').select('name').eq('id', id).single();
      if (error) {
        setOfficeName(null);
        return;
      }
      setOfficeName(data?.name ?? null);
    };

    fetchOfficeName(officeId);
  }, [officeId]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      toast({ title: 'Desktop notifications not supported' });
      return;
    }

    if (Notification.permission === 'granted') {
      toast({ title: 'Desktop notifications already enabled' });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({ title: 'Desktop notifications enabled' });
      return;
    }
    if (permission === 'denied') {
      toast({ title: 'Desktop notifications blocked', description: 'Enable them in your browser settings.' });
      return;
    }
    toast({ title: 'Desktop notifications not enabled' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Channel Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-gradient-to-r from-primary/5 via-background to-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="md:hidden shrink-0" title="Menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[360px] max-w-[90vw]">
              <SheetHeader className="sr-only">
                <SheetTitle>Work navigation</SheetTitle>
              </SheetHeader>
              <WorkSidebar />
            </SheetContent>
          </Sheet>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              if (channelId && officeId) {
                navigate(`/work/${officeId}`);
                return;
              }
              if (officeId) {
                navigate('/work');
                return;
              }
              navigate('/employee/dashboard');
            }}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <span className="truncate">Work</span>
              {officeName ? (
                <>
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className="truncate">{officeName}</span>
                </>
              ) : null}
              {channelId ? (
                <>
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className="truncate">{channel?.name || 'Channel'}</span>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {channelId ? (channel ? getChannelIcon(channel.type) : <Hash className="w-5 h-5 text-muted-foreground" />) : <Layout className="w-5 h-5 text-muted-foreground" />}
              <h1 className="font-semibold text-sm truncate">
                {channelId ? (channel?.name || 'Loading...') : (officeName ? 'Select a channel' : 'Select an office')}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Header Actions */}
           <div className="hidden md:flex items-center gap-1">
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Threads">
               <Hash className="w-4 h-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="text-muted-foreground"
               title="Desktop notifications"
               onClick={requestDesktopPermission}
             >
               <Bell className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Pinned Messages">
               <Pin className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground" title="Member List">
               <Users className="w-4 h-4" />
             </Button>
           </div>
           
           <div className="relative w-40 md:w-60 ml-2 hidden sm:block">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search" 
               className="pl-8 h-8 text-sm bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all" 
                disabled={!channelId}
             />
           </div>

           <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden">
             <Inbox className="w-5 h-5" />
           </Button>
        </div>
      </header>

      {/* Main Content (Chat) */}
      <main className="flex-1 min-h-0">
        {!channelId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="bg-muted/30 p-6 rounded-2xl border mb-4">
              <Layout className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-semibold mb-1 text-foreground">Ready to collaborate</h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {officeName ? 'Pick a channel from the sidebar to start chatting and creating tasks.' : 'Choose an office from the left rail to see channels.'}
            </p>
          </div>
        ) : (
          <ChatArea channelId={channelId} />
        )}
      </main>
    </div>
  );
}
