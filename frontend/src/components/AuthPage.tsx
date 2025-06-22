import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SewingNeedleIcon } from '@/components/icons/SewingNeedleIcon';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, isLoading, error } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: "Passwords don't match.",
        variant: 'destructive',
      });
      return;
    }

    let success = false;
    if (isLogin) {
      success = await login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
    }

    if (success) {
      // onAuthSuccess is no longer needed as the auth store handles the state change
    } else if (error) {
      toast({
        title: isLogin ? 'Login Failed' : 'Sign Up Failed',
        description: error,
        variant: 'destructive',
      });
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <SewingNeedleIcon color="white" className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              TailorFrame
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-foreground">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMode();
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMode();
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    Sign in
                  </a>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ephraim@blocks.so"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-0 h-full px-3 py-2 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign in' : 'Create account')}
              </Button>
            </form>

            {/* Footer Links */}
            {isLogin && (
              <div className="text-center">
                {/* <span className="text-sm text-muted-foreground">
                  Forgot your password?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Add reset password functionality
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    Reset password
                  </a>
                </span> */}
              </div>
            )}

            {!isLogin && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By creating an account, you agree to our{' '}
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Add Terms of Service functionality
                    }}
                    className="p-0 h-auto text-xs font-medium text-primary hover:text-primary/80 cursor-pointer"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Add Privacy Policy functionality
                    }}
                    className="p-0 h-auto text-xs font-medium text-primary hover:text-primary/80 cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            © 2024 TailorFrame. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}