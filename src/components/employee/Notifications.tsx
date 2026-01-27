import { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle, XCircle, AlertTriangle, Info, Calendar, DollarSign, Users, MessageSquare, Square, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'salary' | 'attendance' | 'team';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_text?: string;
  priority: 'low' | 'medium' | 'high';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Task Assigned',
    message: 'You have been assigned a new task: "Design new landing page"',
    type: 'task',
    is_read: false,
    created_at: '2024-01-28T10:30:00Z',
    action_url: '/tasks',
    action_text: 'View Task',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Salary Processed',
    message: 'Your salary for January 2024 has been processed and will be credited by 5th February.',
    type: 'salary',
    is_read: false,
    created_at: '2024-01-28T09:15:00Z',
    action_url: '/salary',
    action_text: 'View Payslip',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Attendance Reminder',
    message: 'Don\'t forget to mark your attendance for today. Check-in time is approaching.',
    type: 'attendance',
    is_read: true,
    created_at: '2024-01-28T08:45:00Z',
    action_url: '/attendance',
    action_text: 'Mark Attendance',
    priority: 'high'
  },
  {
    id: '4',
    title: 'Team Meeting',
    message: 'Sprint planning meeting scheduled for tomorrow at 10:00 AM in Conference Room A.',
    type: 'team',
    is_read: true,
    created_at: '2024-01-27T16:30:00Z',
    action_url: '/calendar',
    action_text: 'Add to Calendar',
    priority: 'medium'
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'The HR system will be under maintenance this weekend from 2:00 AM to 6:00 AM.',
    type: 'info',
    is_read: true,
    created_at: '2024-01-27T14:00:00Z',
    priority: 'low'
  },
  {
    id: '6',
    title: 'Leave Request Approved',
    message: 'Your leave request for February 5-7, 2024 has been approved.',
    type: 'success',
    is_read: false,
    created_at: '2024-01-27T11:20:00Z',
    action_url: '/leave',
    action_text: 'View Details',
    priority: 'medium'
  },
  {
    id: '7',
    title: 'Project Deadline',
    message: 'Website Redesign project deadline is approaching. Only 3 days left.',
    type: 'warning',
    is_read: false,
    created_at: '2024-01-27T10:00:00Z',
    action_url: '/projects',
    action_text: 'View Project',
    priority: 'high'
  },
  {
    id: '8',
    title: 'New Team Member',
    message: 'Welcome Sarah Wilson to the Engineering team as Backend Developer.',
    type: 'team',
    is_read: true,
    created_at: '2024-01-26T15:30:00Z',
    priority: 'low'
  }
];

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'task':
        return <Square className="h-4 w-4 text-blue-600" />;
      case 'salary':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'attendance':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'team':
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-white';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'task':
        return 'bg-blue-100 text-blue-800';
      case 'salary':
        return 'bg-green-100 text-green-800';
      case 'attendance':
        return 'bg-purple-100 text-purple-800';
      case 'team':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notification.is_read) ||
                       (filterRead === 'unread' && !notification.is_read);
    
    return matchesType && matchesRead;
  });

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    toast({
      title: "All Marked as Read",
      description: "All notifications have been marked as read.",
    });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    toast({
      title: "Notification Deleted",
      description: "The notification has been deleted.",
    });
  };

  const handleBulkDelete = () => {
    setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    toast({
      title: "Notifications Deleted",
      description: `${selectedNotifications.length} notifications have been deleted.`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    } else {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    }
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`border-l-4 ${getPriorityColor(notification.priority)} ${!notification.is_read ? 'shadow-sm' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedNotifications.includes(notification.id)}
            onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getNotificationIcon(notification.type)}
              <h4 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <Badge className={getTypeColor(notification.type)}>
                {notification.type}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              
              <div className="flex items-center gap-2">
                {notification.action_url && (
                  <Button variant="outline" size="sm">
                    {notification.action_text}
                  </Button>
                )}
                
                {!notification.is_read && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark Read
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          
          {selectedNotifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              Delete Selected ({selectedNotifications.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm">Select All</span>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filterType !== 'all' || filterRead !== 'all' 
                  ? 'No notifications match your current filters.'
                  : 'You\'re all caught up! No new notifications.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Checkbox defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Task Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about task assignments and updates</p>
              </div>
              <Checkbox defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Salary Notifications</p>
                <p className="text-sm text-muted-foreground">Receive salary and payslip notifications</p>
              </div>
              <Checkbox defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Team Updates</p>
                <p className="text-sm text-muted-foreground">Stay updated with team activities</p>
              </div>
              <Checkbox />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
