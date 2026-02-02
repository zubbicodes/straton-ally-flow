import { useEffect, useMemo, useState } from 'react';
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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (officeId) {
      fetchChannels(officeId);
    }
  }, [officeId]);

  const fetchOffices = async () => {
    const { data } = await supabase.from('offices').select('id, name').order('name');
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

  const filterLower = filter.trim().toLowerCase();
  const filteredChannels = useMemo(() => {
    if (!filterLower) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(filterLower));
  }, [channels, filterLower]);

  const categories = useMemo(() => filteredChannels.filter(c => c.type === 'category'), [filteredChannels]);
  const uncategorized = useMemo(() => filteredChannels.filter(c => !c.parent_id && c.type !== 'category'), [filteredChannels]);

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
    <div className="flex h-full bg-background flex-col md:flex-row">
      {/* Office Rail (Leftmost) */}
      <div className="bg-secondary/30 border-b md:border-b-0 md:border-r flex md:flex-col items-center md:items-center gap-3 px-3 py-3 md:px-0 md:py-4 overflow-x-auto md:overflow-x-visible md:w-[72px]">
        {offices.map((office) => (
          <NavLink
            key={office.id}
            to={`/work/${office.id}`}
            className={({ isActive }) => cn(
              "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all ring-1 ring-transparent shrink-0",
              isActive || officeId === office.id 
                ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground ring-primary/30 shadow-sm" 
                : "bg-background hover:bg-muted/70 ring-border"
            )}
            title={office.name}
          >
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </NavLink>
        ))}
        <Button variant="ghost" size="icon" className="rounded-2xl w-11 h-11 md:w-12 md:h-12 bg-muted/50 hover:bg-green-500 hover:text-white transition-all shrink-0">
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>

      {/* Channel Sidebar */}
      <div className="w-full md:w-60 flex flex-col md:border-r bg-muted/10">
        <div className="h-12 border-b flex items-center px-4 font-semibold">
          <span className="truncate">{offices.find(o => o.id === officeId)?.name || 'Select Office'}</span>
        </div>

        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search channels"
              className="pl-8 h-8 text-sm bg-background/60"
              disabled={!officeId}
            />
          </div>
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
                  isActive ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {getChannelIcon(channel.type, channel.is_private)}
                <span className="truncate">{channel.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Categories */}
          {categories.map(category => {
            const childChannels = filteredChannels.filter(c => c.parent_id === category.id);
            
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
                        isActive ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
