import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const demoUsers = [
  {
    name: 'Alex Admin',
    email: 'admin@amplifi.dev',
    password: 'admin123',
    role: 'Admin',
    avatar: 'AA',
    color: 'bg-indigo-500',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
  {
    name: 'Morgan Manager',
    email: 'manager@amplifi.dev',
    password: 'manager123',
    role: 'Manager',
    avatar: 'MM',
    color: 'bg-violet-500',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  },
  {
    name: 'Sam Student',
    email: 'student@amplifi.dev',
    password: 'student123',
    role: 'Student',
    avatar: 'SS',
    color: 'bg-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Streamlined Workflows',
    description: 'Automate your content approval pipeline',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Granular permissions for every team member',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track performance across all channels',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time feedback and approvals',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDemoUser, setLoadingDemoUser] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (user: (typeof demoUsers)[0]) => {
    setLoadingDemoUser(user.email);
    setError(null);
    setValue('email', user.email);
    setValue('password', user.password);
    try {
      await login(user.email, user.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Demo login failed. Please try again.');
    } finally {
      setLoadingDemoUser(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Left Panel — Branded */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700" />

        {/* Decorative Shapes */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-2xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 h-32 w-32 rotate-45 rounded-2xl border border-white/10 bg-white/5" />
        <div className="absolute right-1/4 top-1/4 h-24 w-24 rotate-12 rounded-xl border border-white/10 bg-white/5" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-3xl font-bold tracking-tight text-white">
                Amplifi
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Where Content
              <br />
              Meets{' '}
              <span className="bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent">
                Precision
              </span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-indigo-100/80">
              The modern platform for teams who create, approve, and publish
              content at scale.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <feature.icon
                    className="h-5 w-5 text-indigo-200"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-indigo-200/70">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-12 pb-8 xl:px-16">
          <p className="text-sm text-indigo-200/50">
            © {new Date().getFullYear()} Amplifi. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Brand */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Amplifi
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Sign in to your Amplifi workspace
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/50">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail
                    className={cn(
                      'h-4 w-4',
                      errors.email
                        ? 'text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={cn(
                    'block w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    'dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500',
                    'dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20',
                    errors.email
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock
                    className={cn(
                      'h-4 w-4',
                      errors.password
                        ? 'text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={cn(
                    'block w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    'dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500',
                    'dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20',
                    errors.password
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all',
                'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                'dark:focus:ring-offset-slate-950',
                'disabled:cursor-not-allowed disabled:opacity-70'
              )}
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Demo Access
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Demo User Cards */}
          <div className="space-y-2.5">
            {demoUsers.map((user, i) => (
              <motion.button
                key={user.email}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                onClick={() => handleDemoLogin(user)}
                disabled={loadingDemoUser !== null}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all',
                  'hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm',
                  'dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                    user.color
                  )}
                >
                  {loadingDemoUser === user.email ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    user.avatar
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>

                {/* Role Badge */}
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    user.badgeColor
                  )}
                >
                  {user.role}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
