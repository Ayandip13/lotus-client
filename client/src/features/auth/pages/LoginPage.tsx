import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { loginFormSchema, LoginFormValues } from '../schemas/auth.schemas';
import { useAuth } from '../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Alert } from '../../../components/ui/Alert';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading: isAuthRestoring } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  if (!isAuthRestoring && isAuthenticated) {
    const destination = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setErrorMessage(null);
      await login({
        username: values.username.trim(),
        password: values.password.trim(),
      });
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid login credentials. Please verify and try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-lg shadow-sm">
            LC
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Lotus Caterer
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Internal Catering Management Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="mt-8 shadow-sm border-slate-200/90">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-slate-900">Partner Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your partner credentials to access the shared management system.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5">
                <Alert variant="error" title="Authentication Failed">
                  {errorMessage}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Username Field */}
              <Input
                label="Partner Username"
                id="username"
                autoComplete="username"
                placeholder="e.g. partner1"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                error={errors.username?.message}
                disabled={isSubmitting}
                {...register('username')}
              />

              {/* Password Field */}
              <div className="relative">
                <Input
                  label="Password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="pointer-events-auto p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11"
                  variant="primary"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Management
                </Button>
              </div>
            </form>

            {/* Equal Partner System Assurance Notice */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Equal 3-Partner Security Policy active. All three partners possess equal operational authority and financial oversight.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized Partner Access Only • Lotus Caterer Management System
        </p>
      </div>
    </div>
  );
};
