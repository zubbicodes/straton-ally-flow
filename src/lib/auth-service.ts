import { supabase } from '@/integrations/supabase/client';

export async function createUserAsAdmin(userData: {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'employee';
}) {
  // Store current admin session
  const { data: { session } } = await supabase.auth.getSession();
  const adminUserId = session?.user?.id;

  if (!adminUserId) {
    throw new Error('No admin session found');
  }

  try {
    // Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          created_by_admin: true, // Flag to identify admin-created users
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const newUserId = authData.user.id;

    // Immediately sign back in as admin if we got switched
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token!,
      });
    }

    return authData.user;
  } catch (error) {
    // Try to restore admin session on error
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token!,
      });
    }
    throw error;
  }
}
