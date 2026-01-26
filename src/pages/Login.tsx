import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signIn, isAllowedEmail, getRedirectPath, getUserRole } from '@/lib/auth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine(
      (email) => isAllowedEmail(email),
      'Only @stratonally.com email addresses are allowed'
    ),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { user, error } = await signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      if (user) {
        const role = await getUserRole(user.id);
        const redirectPath = getRedirectPath(role);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Geometric pattern */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-accent/20 via-background to-info/10">
        {/* Geometric shapes */}
        <div className="absolute inset-0">
          {/* Large circle */}
          <div className="absolute -left-20 top-1/4 w-80 h-80 rounded-full bg-accent/30" />
          {/* Medium circles */}
          <div className="absolute left-40 top-20 w-40 h-40 rounded-full bg-info/20" />
          <div className="absolute left-20 bottom-40 w-60 h-60 rounded-full bg-success/15" />
          {/* Small accents */}
          <div className="absolute right-20 top-40 w-24 h-24 rounded-full bg-warning/25" />
          <div className="absolute left-60 bottom-20 w-32 h-32 rounded-full bg-accent/40" />
          {/* Curved shapes */}
          <div className="absolute left-0 bottom-0 w-96 h-96">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path
                d="M 0 100 Q 50 0 100 50 Q 150 100 100 150 Q 50 200 0 100"
                fill="hsl(var(--accent) / 0.25)"
              />
            </svg>
          </div>
        </div>
        
        {/* Brand overlay */}
        <div className="absolute bottom-12 left-12 z-10">
          <h1 className="text-5xl font-display font-bold text-foreground">FLOW</h1>
          <p className="text-lg text-muted-foreground mt-2">by STRATON ALLY</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground">FLOW</h1>
            <p className="text-muted-foreground mt-1">by STRATON ALLY</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-2">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@stratonally.com"
                  {...register('email')}
                  className="h-12 bg-secondary/50 border-border focus:border-accent focus:ring-accent/20"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="h-12 bg-secondary/50 border-border focus:border-accent focus:ring-accent/20 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground">
              Access is restricted to STRATON ALLY employees only.
              <br />
              Contact your administrator for account issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
