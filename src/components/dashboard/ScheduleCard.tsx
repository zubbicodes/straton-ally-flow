import { CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    <div className="card-elevated p-3 md:p-4 rounded-lg h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Schedule ({totalCount})</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full h-7 mb-3 bg-muted/50 p-0.5">
          <TabsTrigger value="all" className="flex-1 text-[10px] h-6">All</TabsTrigger>
          <TabsTrigger value="meetings" className="flex-1 text-[10px] h-6">Meetings</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 text-[10px] h-6">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 mt-0">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </TabsContent>
        
        <TabsContent value="meetings" className="space-y-2 mt-0">
          {events.filter(e => e.type === 'meeting').map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </TabsContent>
        
        <TabsContent value="events" className="space-y-2 mt-0">
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
    <div className="p-2.5 rounded-md bg-muted/30 border border-border/50">
      <h4 className="font-medium text-xs line-clamp-1">{event.title}</h4>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {event.date} • {event.time}
      </p>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{event.platform}</span>
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
        
        <div className="flex -space-x-1.5">
          {event.attendees.slice(0, 3).map((attendee, i) => (
            <Avatar key={i} className="h-5 w-5 border-2 border-card">
              <AvatarFallback className="text-[8px] bg-muted">
                {attendee.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
