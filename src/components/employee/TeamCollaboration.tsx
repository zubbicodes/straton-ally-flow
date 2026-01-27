import { useState, useEffect } from 'react';
import { Users, MessageSquare, Calendar, Star, MapPin, Mail, Phone, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  location: string;
  skills: string[];
  projects: string[];
  join_date: string;
}

interface TeamProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  team_members: string[];
  deadline: string;
  priority: 'low' | 'medium' | 'high';
}

interface TeamActivity {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'task' | 'project' | 'comment' | 'meeting';
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 234-567-8900',
    designation: 'Senior Developer',
    department: 'Engineering',
    avatar: 'JD',
    status: 'online',
    location: 'New York Office',
    skills: ['React', 'TypeScript', 'Node.js'],
    projects: ['Website Redesign', 'API Development'],
    join_date: '2022-03-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '+1 234-567-8901',
    designation: 'UX Designer',
    department: 'Design',
    avatar: 'JS',
    status: 'busy',
    location: 'Remote',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    projects: ['Website Redesign', 'Mobile App'],
    join_date: '2022-01-20'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1 234-567-8902',
    designation: 'Project Manager',
    department: 'Management',
    avatar: 'MJ',
    status: 'online',
    location: 'San Francisco Office',
    skills: ['Agile', 'Scrum', 'Leadership'],
    projects: ['Platform Maintenance', 'Performance Optimization'],
    join_date: '2021-11-10'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1 234-567-8903',
    designation: 'Backend Developer',
    department: 'Engineering',
    avatar: 'SW',
    status: 'away',
    location: 'London Office',
    skills: ['Python', 'PostgreSQL', 'AWS'],
    projects: ['API Development', 'Database Migration'],
    join_date: '2022-06-01'
  }
];

const mockProjects: TeamProject[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design',
    status: 'active',
    progress: 65,
    team_members: ['1', '2'],
    deadline: '2024-03-15',
    priority: 'high'
  },
  {
    id: '2',
    name: 'API Development',
    description: 'Develop RESTful APIs for mobile applications',
    status: 'active',
    progress: 40,
    team_members: ['1', '4'],
    deadline: '2024-04-01',
    priority: 'medium'
  },
  {
    id: '3',
    name: 'Platform Maintenance',
    description: 'Ongoing maintenance and bug fixes',
    status: 'active',
    progress: 80,
    team_members: ['3'],
    deadline: '2024-02-28',
    priority: 'low'
  }
];

const mockActivities: TeamActivity[] = [
  {
    id: '1',
    user_id: '1',
    user_name: 'John Doe',
    action: 'completed task',
    target: 'Fix authentication bug',
    timestamp: '2024-01-28T10:30:00Z',
    type: 'task'
  },
  {
    id: '2',
    user_id: '2',
    user_name: 'Jane Smith',
    action: 'updated design',
    target: 'Landing page mockups',
    timestamp: '2024-01-28T09:15:00Z',
    type: 'project'
  },
  {
    id: '3',
    user_id: '3',
    user_name: 'Mike Johnson',
    action: 'scheduled meeting',
    target: 'Sprint planning',
    timestamp: '2024-01-28T08:00:00Z',
    type: 'meeting'
  }
];

export function TeamCollaboration() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [projects, setProjects] = useState<TeamProject[]>(mockProjects);
  const [activities, setActivities] = useState<TeamActivity[]>(mockActivities);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageRecipient, setMessageRecipient] = useState<string>('');
  const { toast } = useToast();

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-red-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const getProjectStatusColor = (status: TeamProject['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TeamProject['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const handleSendMessage = () => {
    if (!messageRecipient || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and enter a message.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would send the message via your messaging system
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${messageRecipient}.`,
    });

    setMessage('');
    setMessageRecipient('');
    setIsMessageDialogOpen(false);
  };

  const MemberCard = ({ member }: { member: TeamMember }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{member.name}</h4>
              <Badge variant="outline" className="text-xs">
                {getStatusText(member.status)}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{member.designation}</p>
            <p className="text-xs text-muted-foreground mb-2">{member.department}</p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              {member.location}
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {member.skills.slice(0, 3).map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {member.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{member.skills.length - 3}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedMember(member)}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setMessageRecipient(member.name);
                  setIsMessageDialogOpen(true);
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Collaboration</h3>
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Team Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={messageRecipient} onValueChange={setMessageRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name} - {member.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge className={getProjectStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.team_members.length} members
                      </div>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                        {activity.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>
                        <span className="text-muted-foreground"> {activity.action} </span>
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy at h:mm a')}
                      </p>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Member Detail Dialog */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Team Member Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                    {selectedMember.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                  <p className="text-muted-foreground">{selectedMember.designation}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`} />
                    <span className="text-sm">{getStatusText(selectedMember.status)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{selectedMember.email}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{selectedMember.phone}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Department</Label>
                  <p className="text-sm mt-1">{selectedMember.department}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{selectedMember.location}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMember.skills.map(skill => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Current Projects</Label>
                <div className="space-y-1 mt-1">
                  {selectedMember.projects.map(project => (
                    <div key={project} className="text-sm">
                      • {project}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setMessageRecipient(selectedMember.name);
                    setIsMessageDialogOpen(true);
                    setSelectedMember(null);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
