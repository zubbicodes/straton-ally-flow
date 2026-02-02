import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Hash, 
  Volume2, 
  Megaphone, 
  Lock, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Office {
  id: string;
  name: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'category';
  parent_id: string | null;
  office_id: string;
  is_private: boolean;
}

export function WorkSidebar() {
  const { officeId, channelId } = useParams();
  const [offices, setOffices] = useState<Office[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (officeId) {
      fetchChannels(officeId);
    }
  }, [officeId]);

  const fetchOffices = async () => {
    const { data } = await supabase.from('offices').select('id, name');
    if (data) {
      setOffices(data);
      // Default to first office if none selected
      // logic handled in parent or router usually, but here we might just display list
    }
    setLoading(false);
  };

  const fetchChannels = async (oId: string) => {
    const { data } = await supabase
      .from('work_channels')
      .select('*')
      .eq('office_id', oId)
      .order('name');
    
    if (data) {
      // Cast data to unknown first, then to Channel[] to avoid type conflicts if types don't match exactly
      const typedChannels = data as unknown as Channel[];
      setChannels(typedChannels);
      // Auto-expand all categories by default
      const categories = typedChannels.filter((c) => c.type === 'category');
      const expanded = categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {} as Record<string, boolean>);
      setExpandedCategories(expanded);
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const categories = channels.filter(c => c.type === 'category');
  const uncategorized = channels.filter(c => !c.parent_id && c.type !== 'category');

  const getChannelIcon = (type: string, isPrivate: boolean) => {
    if (isPrivate) return <Lock className="w-4 h-4 mr-2 text-muted-foreground" />;
    switch (type) {
      case 'voice': return <Volume2 className="w-4 h-4 mr-2 text-muted-foreground" />;
      case 'announcement': return <Megaphone className="w-4 h-4 mr-2 text-muted-foreground" />;
      default: return <Hash className="w-4 h-4 mr-2 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="w-64 border-r h-full bg-sidebar p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Office Rail (Leftmost) */}
      <div className="w-[72px] bg-secondary/30 border-r flex flex-col items-center py-4 gap-4">
        {offices.map(office => (
          <NavLink
            key={office.id}
            to={`/work/${office.id}`}
            className={({ isActive }) => cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all hover:rounded-2xl",
              isActive || officeId === office.id 
                ? "bg-primary text-primary-foreground rounded-2xl" 
                : "bg-background hover:bg-muted"
            )}
            title={office.name}
          >
            <Building2 className="w-6 h-6" />
          </NavLink>
        ))}
        <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-muted/50 hover:bg-green-500 hover:text-white transition-all">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Channel Sidebar */}
      <div className="w-60 flex flex-col border-r bg-muted/10">
        <div className="h-12 border-b flex items-center px-4 font-semibold shadow-sm">
          {offices.find(o => o.id === officeId)?.name || 'Select Office'}
        </div>
        
        <ScrollArea className="flex-1 px-2 py-3">
          {/* Uncategorized Channels */}
          <div className="mb-4 space-y-1">
            {uncategorized.map(channel => (
              <NavLink
                key={channel.id}
                to={`/work/${officeId}/channel/${channel.id}`}
                className={({ isActive }) => cn(
                  "flex items-center px-2 py-1.5 rounded-md text-sm transition-colors",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {getChannelIcon(channel.type, channel.is_private)}
                <span className="truncate">{channel.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Categories */}
          {categories.map(category => {
            const childChannels = channels.filter(c => c.parent_id === category.id);
            
            return (
              <Collapsible 
                key={category.id} 
                open={expandedCategories[category.id]}
                onOpenChange={() => toggleCategory(category.id)}
                className="mb-2"
              >
                <CollapsibleTrigger className="flex items-center w-full px-1 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider mb-1">
                  {expandedCategories[category.id] ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                  {category.name}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5">
                  {childChannels.map(channel => (
                    <NavLink
                      key={channel.id}
                      to={`/work/${officeId}/channel/${channel.id}`}
                      className={({ isActive }) => cn(
                        "flex items-center px-2 py-1.5 rounded-md text-sm transition-colors ml-2",
                        isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      {getChannelIcon(channel.type, channel.is_private)}
                      <span className="truncate">{channel.name}</span>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </ScrollArea>
        
        <div className="p-3 border-t bg-background/50">
          <Button variant="outline" className="w-full justify-start text-muted-foreground text-xs h-8">
            <Plus className="w-3 h-3 mr-2" /> Add Channel
          </Button>
        </div>
      </div>
    </div>
  );
}
