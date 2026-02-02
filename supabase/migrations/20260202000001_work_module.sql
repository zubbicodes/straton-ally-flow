-- Work Module Migration

-- Create work_channels table
CREATE TABLE public.work_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE, -- Link to office (Main Channel)
    parent_id UUID REFERENCES public.work_channels(id) ON DELETE CASCADE, -- For sub-channels
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'announcement', 'category')),
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_channel_members table (for private channels or specific permissions)
CREATE TABLE public.work_channel_members (
    channel_id UUID REFERENCES public.work_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (channel_id, user_id)
);

-- Create work_messages table
CREATE TABLE public.work_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.work_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of {url, name, type, size}
    parent_id UUID REFERENCES public.work_messages(id) ON DELETE SET NULL, -- For threaded replies
    reactions JSONB DEFAULT '{}'::jsonb, -- Map of emoji -> array of user_ids
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create work_tasks table
CREATE TABLE public.work_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.work_channels(id) ON DELETE SET NULL, -- Optional link to channel
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'complete')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- In minutes
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for work_channels
-- Admins have full access
CREATE POLICY "Admins can manage channels" ON public.work_channels
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Employees can view channels if they are part of the office or if it's public in their office
CREATE POLICY "Employees can view office channels" ON public.work_channels
    FOR SELECT USING (
        -- Channel is linked to an office they belong to (via employee record)
        (office_id IN (
            SELECT office_id FROM public.employees WHERE user_id = auth.uid()
        ))
        OR
        -- Or they are a member of the channel explicitly
        (EXISTS (
            SELECT 1 FROM public.work_channel_members 
            WHERE channel_id = work_channels.id AND user_id = auth.uid()
        ))
    );

-- Policies for work_channel_members
CREATE POLICY "Admins can manage channel members" ON public.work_channel_members
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can view channel members" ON public.work_channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_channel_members.channel_id
            AND (
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                EXISTS (SELECT 1 FROM public.work_channel_members m WHERE m.channel_id = c.id AND m.user_id = auth.uid())
            )
        )
    );

-- Policies for work_messages
CREATE POLICY "Users can view messages in accessible channels" ON public.work_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_messages.channel_id
            AND (
                public.has_role(auth.uid(), 'admin')
                OR
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                EXISTS (SELECT 1 FROM public.work_channel_members m WHERE m.channel_id = c.id AND m.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert messages in accessible channels" ON public.work_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_messages.channel_id
            AND (
                public.has_role(auth.uid(), 'admin')
                OR
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                EXISTS (SELECT 1 FROM public.work_channel_members m WHERE m.channel_id = c.id AND m.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can update own messages" ON public.work_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON public.work_messages
    FOR DELETE USING (auth.uid() = user_id);


-- Policies for work_tasks
CREATE POLICY "Admins can manage tasks" ON public.work_tasks
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view tasks" ON public.work_tasks
    FOR SELECT USING (true); -- Simplified visibility for collaboration

CREATE POLICY "Employees can create tasks" ON public.work_tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Employees can update assigned tasks or created tasks" ON public.work_tasks
    FOR UPDATE USING (
        assignee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR
        creator_id = auth.uid()
        OR
        public.has_role(auth.uid(), 'admin')
    );

-- Triggers for updated_at
CREATE TRIGGER update_work_channels_updated_at
    BEFORE UPDATE ON public.work_channels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_messages_updated_at
    BEFORE UPDATE ON public.work_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_tasks_updated_at
    BEFORE UPDATE ON public.work_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create channels for new offices (optional, but good for consistency)
CREATE OR REPLACE FUNCTION public.handle_new_office_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create 'General' channel for the new office
    INSERT INTO public.work_channels (office_id, name, type, description)
    VALUES (NEW.id, 'General', 'text', 'General discussion for ' || NEW.name);
    
    -- Create 'Announcements' channel
    INSERT INTO public.work_channels (office_id, name, type, description)
    VALUES (NEW.id, 'Announcements', 'announcement', 'Official announcements for ' || NEW.name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_office_created
    AFTER INSERT ON public.offices
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_office_channels();

-- Create Realtime publication for messages
-- Note: You need to enable replication for these tables in Supabase dashboard or via SQL if you have superuser
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_channels;
