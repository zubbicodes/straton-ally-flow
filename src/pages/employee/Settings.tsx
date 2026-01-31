import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function EmployeeSettings() {
  const { toast } = useToast();
  const { user, refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: '', address: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || 'User';
    return name.charAt(0).toUpperCase();
  }, [user?.fullName]);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authUser) throw new Error('Not signed in');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setAvatarUrl(profile?.avatar_url || null);

        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('id, phone, address')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (employeeError) throw employeeError;

        setEmployeeId(employee?.id || null);
        profileForm.reset({
          phone: employee?.phone || '',
          address: employee?.address || '',
        });
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [profileForm, toast]);

  const saveProfile = async (data: ProfileFormData) => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Employee record not found',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
        })
        .eq('id', employeeId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated' });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user?.email) throw new Error('Missing user email');

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      });

      if (reauthError) throw new Error('Current password is incorrect');

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: 'Success', description: 'Password updated' });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) throw new Error('Not signed in');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const objectPath = `${authUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(objectPath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(objectPath);
      const nextUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: nextUrl })
        .eq('id', authUser.id);

      if (profileError) throw profileError;

      setAvatarUrl(nextUrl);
      await refetch();
      toast({ title: 'Success', description: 'Profile photo updated' });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and security</p>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-success text-success-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingAvatar ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input {...profileForm.register('phone')} placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea {...profileForm.register('address')} placeholder="Enter address" rows={4} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
