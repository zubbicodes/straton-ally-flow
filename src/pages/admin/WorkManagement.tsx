import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Hash, Volume2, Megaphone, Trash2, Edit, Settings, UserPlus, X, Search, ChevronDown, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  description?: string;
}

interface ChannelMember {
  channel_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
}

interface NewChannelPayload {
  office_id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'category';
  description: string;
  is_private: boolean;
  parent_id?: string;
}

interface NewChannelFormState {
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'category';
  parent_id: string;
  description: string;
  is_private: boolean;
}

export default function WorkManagement() {
  const [activeTab, setActiveTab] = useState('channels');
  const [offices, setOffices] = useState<Office[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddOfficeOpen, setIsAddOfficeOpen] = useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState('');
  
  // New Channel Form State
  const [newChannel, setNewChannel] = useState<NewChannelFormState>({
    name: '',
    type: 'text',
    parent_id: 'none',
    description: '',
    is_private: false
  });

  const [selectedChannelForMembers, setSelectedChannelForMembers] = useState<string | null>(null);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (selectedOffice) {
      fetchChannels(selectedOffice.id);
    } else if (offices.length > 0) {
      setSelectedOffice(offices[0]);
    }
  }, [selectedOffice, offices]);

  useEffect(() => {
    if (!selectedChannelForMembers) {
      setChannelMembers([]);
      return;
    }

    fetchChannelMembers(selectedChannelForMembers);
  }, [selectedChannelForMembers]);

  useEffect(() => {
    if (isAddMemberOpen) return;
    setSearchQuery('');
    setSearchResults([]);
  }, [isAddMemberOpen]);

  useEffect(() => {
    if (!isAddMemberOpen) return;
    if (!selectedOffice) return;
    if (!selectedChannelForMembers) return;

    const query = searchQuery.trim();

    const timer = window.setTimeout(() => {
      if (query.length >= 2) {
        searchUsers(query);
        return;
      }

      fetchOfficeEmployees(selectedOffice.id);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [isAddMemberOpen, searchQuery, selectedOffice, selectedChannelForMembers]);

  const fetchOffices = async () => {
    const { data, error } = await supabase.from('offices').select('*').order('name');
    if (error) {
      console.error('Error fetching offices:', error);
      toast.error(`Failed to fetch offices: ${error.message}`);
      return;
    }
    setOffices(data || []);
    setLoading(false);
  };

  const fetchChannels = async (officeId: string) => {
    const { data, error } = await supabase
      .from('work_channels')
      .select('*')
      .eq('office_id', officeId)
      .order('name');
    
    if (error) {
      console.error('Error fetching channels:', error);
      toast.error(`Failed to fetch channels: ${error.message}`);
      return;
    }
    setChannels((data as unknown as Channel[]) || []);
  };

  const handleCreateOffice = async () => {
    if (!newOfficeName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('offices')
        .insert({
          name: newOfficeName,
          address: 'N/A',
          city: 'N/A',
          country: 'N/A',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setOffices([...offices, data]);
      setNewOfficeName('');
      setIsAddOfficeOpen(false);
      toast.success('Office created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create office');
    }
  };

  const handleCreateChannel = async () => {
    if (!selectedOffice || !newChannel.name.trim()) return;

    try {
      const payload: NewChannelPayload = {
        office_id: selectedOffice.id,
        name: newChannel.name,
        type: newChannel.type,
        description: newChannel.description,
        is_private: newChannel.is_private,
      };

      if (newChannel.parent_id !== 'none') {
        payload.parent_id = newChannel.parent_id;
      }

      const { data, error } = await supabase
        .from('work_channels')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setChannels([...channels, data as unknown as Channel]);
      setNewChannel({
        name: '',
        type: 'text',
        parent_id: 'none',
        description: '',
        is_private: false
      });
      setIsAddChannelOpen(false);
      toast.success('Channel created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create channel');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const { error } = await supabase.from('work_channels').delete().eq('id', id);
      if (error) throw error;
      setChannels(channels.filter(c => c.id !== id));
      toast.success('Channel deleted');
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const fetchChannelMembers = async (channelId: string) => {
    try {
      // 1. Get members
      const { data: membersData, error: membersError } = await supabase
        .from('work_channel_members')
        .select('*')
        .eq('channel_id', channelId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setChannelMembers([]);
        return;
      }

      // 2. Get profiles for these members
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // 3. Merge data
      const mergedMembers: ChannelMember[] = membersData.map(member => ({
        ...member,
        role: member.role as 'admin' | 'moderator' | 'member',
        profile: profilesData?.find(p => p.id === member.user_id)
      }));

      setChannelMembers(mergedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch channel members');
    }
  };

  const fetchOfficeEmployees = async (officeId: string) => {
    setIsSearching(true);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('user_id')
        .eq('office_id', officeId);

      if (employeesError) throw employeesError;

      const userIds = (employeesData || []).map((e) => e.user_id).filter(Boolean) as string[];
      if (userIds.length === 0) {
        setSearchResults([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id,full_name,email,avatar_url')
        .in('id', userIds)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;
      setSearchResults((profilesData || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching office employees:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,email,avatar_url')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults((data || []) as Profile[]);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedChannelForMembers) return;

    try {
      const { error } = await supabase
        .from('work_channel_members')
        .insert({
          channel_id: selectedChannelForMembers,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Member added successfully');
      fetchChannelMembers(selectedChannelForMembers);
      // Optional: Don't close dialog to allow adding more
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedChannelForMembers || !confirm('Remove this member?')) return;

    try {
      const { error } = await supabase
        .from('work_channel_members')
        .delete()
        .eq('channel_id', selectedChannelForMembers)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Member removed');
      setChannelMembers(channelMembers.filter(m => m.user_id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!selectedChannelForMembers) return;

    try {
      const { error } = await supabase
        .from('work_channel_members')
        .update({ role: newRole })
        .eq('channel_id', selectedChannelForMembers)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role updated');
      setChannelMembers(channelMembers.map(m => 
        m.user_id === userId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const categories = channels.filter(c => c.type === 'category');
  const getSubChannels = (categoryId: string) => channels.filter(c => c.parent_id === categoryId);
  const uncategorized = channels.filter(c => !c.parent_id && c.type !== 'category');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Work Module Management</h1>
          <p className="text-muted-foreground">Manage channels, permissions, and settings for the Work module.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="channels">Channels & Offices</TabsTrigger>
          <TabsTrigger value="permissions">Permissions & Roles</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
            {/* Offices List */}
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Offices</CardTitle>
                  <Dialog open={isAddOfficeOpen} onOpenChange={setIsAddOfficeOpen}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Office</DialogTitle>
                        <DialogDescription>Create a new office location for the Work module.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Office Name</Label>
                          <Input 
                            placeholder="e.g. New York HQ" 
                            value={newOfficeName}
                            onChange={(e) => setNewOfficeName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateOffice}>Create Office</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col p-2 gap-1">
                    {offices.map(office => (
                      <button
                        key={office.id}
                        onClick={() => setSelectedOffice(office)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left ${
                          selectedOffice?.id === office.id
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{office.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Channels List */}
            <Card className="md:col-span-3 flex flex-col">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedOffice ? `${selectedOffice.name} Channels` : 'Select an Office'}
                    </CardTitle>
                    <CardDescription>Manage channels and categories</CardDescription>
                  </div>
                  <Dialog open={isAddChannelOpen} onOpenChange={setIsAddChannelOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!selectedOffice}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Channel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Channel Name</Label>
                          <Input 
                            value={newChannel.name}
                            onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={newChannel.type} 
                            onValueChange={(val: 'text' | 'voice' | 'announcement' | 'category') => setNewChannel({...newChannel, type: val})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Channel</SelectItem>
                              <SelectItem value="voice">Voice Channel</SelectItem>
                              <SelectItem value="announcement">Announcement</SelectItem>
                              <SelectItem value="category">Category (Folder)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newChannel.type !== 'category' && (
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select 
                              value={newChannel.parent_id} 
                              onValueChange={(val) => setNewChannel({...newChannel, parent_id: val})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Category</SelectItem>
                                {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input 
                            value={newChannel.description}
                            onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateChannel}>Create Channel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  {/* Categories */}
                  <div className="space-y-6">
                    {categories.map(category => (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            <ChevronDown className="h-3 w-3" />
                            {category.name}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteChannel(category.id)}>
                               <Trash2 className="h-3 w-3 text-destructive" />
                             </Button>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          {getSubChannels(category.id).map(channel => (
                            <div key={channel.id} className="flex items-center justify-between group px-2 py-1.5 rounded-md hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                {channel.type === 'voice' ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : 
                                 channel.type === 'announcement' ? <Megaphone className="h-4 w-4 text-muted-foreground" /> :
                                 <Hash className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-sm">{channel.name}</span>
                                {channel.is_private && <Lock className="h-3 w-3 text-muted-foreground" />}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6">
                                  <Settings className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteChannel(channel.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Uncategorized */}
                    {uncategorized.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Uncategorized</div>
                        {uncategorized.map(channel => (
                          <div key={channel.id} className="flex items-center justify-between group px-2 py-1.5 rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                {channel.type === 'voice' ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : 
                                 channel.type === 'announcement' ? <Megaphone className="h-4 w-4 text-muted-foreground" /> :
                                 <Hash className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm">{channel.name}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6">
                                <Settings className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteChannel(channel.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
             {/* Channel Selector for Permissions */}
             <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Select Channel</CardTitle>
                <CardDescription>
                  {selectedOffice ? selectedOffice.name : 'Select Office First'}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col p-2 gap-1">
                    {!selectedOffice ? (
                       <div className="p-4 text-center text-muted-foreground text-sm">
                         Please select an office in the "Channels" tab first.
                       </div>
                    ) : (
                      channels
                        .filter(c => c.type !== 'category') // Only show actual channels
                        .map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannelForMembers(channel.id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left ${
                            selectedChannelForMembers === channel.id
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {channel.type === 'voice' ? <Volume2 className="h-4 w-4" /> : 
                           channel.type === 'announcement' ? <Megaphone className="h-4 w-4" /> :
                           <Hash className="h-4 w-4" />}
                          <span className="truncate">{channel.name}</span>
                          {channel.is_private && <Settings className="h-3 w-3 ml-auto opacity-50" />}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card className="md:col-span-3 flex flex-col">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Channel Members
                    </CardTitle>
                    <CardDescription>
                      {selectedChannelForMembers 
                        ? `Manage access for #${channels.find(c => c.id === selectedChannelForMembers)?.name}`
                        : 'Select a channel to manage members'}
                    </CardDescription>
                  </div>
                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!selectedChannelForMembers}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Members to Channel</DialogTitle>
                        <DialogDescription>Search for users to add to this channel.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or email..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="h-[200px] border rounded-md overflow-hidden">
                          <ScrollArea className="h-full">
                            {searchResults.length === 0 ? (
                              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                {isSearching ? 'Loading...' : (searchQuery.trim().length >= 2 ? 'No users found' : 'No employees found')}
                              </div>
                            ) : (
                              <div className="divide-y">
                                {searchResults.map(user => {
                                  const isMember = channelMembers.some(m => m.user_id === user.id);
                                  return (
                                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={user.avatar_url || undefined} />
                                          <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{user.full_name}</span>
                                          <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant={isMember ? "secondary" : "default"}
                                        disabled={isMember}
                                        onClick={() => handleAddMember(user.id)}
                                      >
                                        {isMember ? 'Joined' : 'Add'}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                   {!selectedChannelForMembers ? (
                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                       <Settings className="h-12 w-12 mb-4 opacity-20" />
                       <p>Select a channel from the list to manage its members.</p>
                     </div>
                   ) : channelMembers.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                       <p>No members found in this channel.</p>
                       <p className="text-sm">Add members to control access.</p>
                     </div>
                   ) : (
                     <div className="divide-y">
                       {channelMembers.map(member => (
                         <div key={member.user_id} className="flex items-center justify-between p-4 hover:bg-muted/20">
                           <div className="flex items-center gap-4">
                             <Avatar>
                               <AvatarImage src={member.profile?.avatar_url || undefined} />
                               <AvatarFallback>{member.profile?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                             </Avatar>
                             <div>
                               <div className="font-medium flex items-center gap-2">
                                 {member.profile?.full_name || 'Unknown User'}
                                 {member.role === 'admin' && <Badge variant="default" className="text-[10px] h-5">Admin</Badge>}
                                 {member.role === 'moderator' && <Badge variant="secondary" className="text-[10px] h-5">Mod</Badge>}
                               </div>
                               <div className="text-sm text-muted-foreground">{member.profile?.email}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <Select 
                               value={member.role} 
                               onValueChange={(val: 'admin' | 'moderator' | 'member') => handleUpdateRole(member.user_id, val)}
                             >
                               <SelectTrigger className="w-[110px] h-8 text-xs">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="admin">Admin</SelectItem>
                                 <SelectItem value="moderator">Moderator</SelectItem>
                                 <SelectItem value="member">Member</SelectItem>
                               </SelectContent>
                             </Select>
                             <Button 
                               size="icon" 
                               variant="ghost" 
                               className="h-8 w-8 text-muted-foreground hover:text-destructive"
                               onClick={() => handleRemoveMember(member.user_id)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
