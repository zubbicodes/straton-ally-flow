import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, getCurrentUser, getRedirectPath } from '@/lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  skipRedirect: boolean;
  setSkipRedirect: (skip: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skipRedirect, setSkipRedirect] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUser = async () => {
    const authUser = await getCurrentUser();
    setUser(authUser);
    return authUser;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_IN' && newSession && !skipRedirect) {
          // Use setTimeout to prevent state update conflicts
          setTimeout(async () => {
            const authUser = await fetchUser();
            // Check if this is a user creation that should skip redirect
            const shouldSkip = newSession.user?.user_metadata?.created_by_admin;
            
            // Only redirect if we have a user with a role and we're not on admin pages
            // and this isn't a user creation operation
            if (authUser?.role && !location.pathname.startsWith('/admin') && !shouldSkip) {
              const redirectPath = getRedirectPath(authUser.role);
              navigate(redirectPath, { replace: true });
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSkipRedirect(false);
          navigate('/login', { replace: true });
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        await fetchUser();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const refetch = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, refetch, skipRedirect, setSkipRedirect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
