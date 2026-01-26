import { CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'event';
  platform: string;
  attendees: string[];
}

interface ScheduleCardProps {
  events: ScheduleEvent[];
  totalCount: number;
}

export function ScheduleCard({ events, totalCount }: ScheduleCardProps) {
  return (
    <div className="card-elevated p-4 md:p-5 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Schedule ({totalCount})</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full h-8 mb-4 bg-muted/50">
          <TabsTrigger value="all" className="flex-1 text-xs h-7">All</TabsTrigger>
          <TabsTrigger value="meetings" className="flex-1 text-xs h-7">Meetings</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 text-xs h-7">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-0">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </TabsContent>
        
        <TabsContent value="meetings" className="space-y-3 mt-0">
          {events.filter(e => e.type === 'meeting').map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </TabsContent>
        
        <TabsContent value="events" className="space-y-3 mt-0">
          {events.filter(e => e.type === 'event').map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventItem({ event }: { event: ScheduleEvent }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
      <h4 className="font-medium text-sm line-clamp-1">{event.title}</h4>
      <p className="text-xs text-muted-foreground mt-1">
        {event.date} • {event.time}
      </p>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{event.platform}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>
        
        <div className="flex -space-x-2">
          {event.attendees.slice(0, 3).map((attendee, i) => (
            <Avatar key={i} className="h-6 w-6 border-2 border-card">
              <AvatarFallback className="text-[10px] bg-muted">
                {attendee.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
