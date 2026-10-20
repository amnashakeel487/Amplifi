import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const passwordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function calculateStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
const strengthColors = [
  'bg-slate-200 dark:bg-slate-700',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
];
const strengthTextColors = [
  'text-slate-400',
  'text-red-500',
  'text-orange-500',
  'text-amber-500',
  'text-lime-600 dark:text-lime-400',
  'text-emerald-600 dark:text-emerald-400',
];

export default function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const strength = useMemo(() => calculateStrength(newPassword), [newPassword]);

  const onSubmit = async (data: PasswordChangeFormData) => {
    setIsLoading(true);
    try {
      await updatePassword(data.newPassword);
      navigate('/');
    } catch {
      // Error handling is managed by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* Background subtle pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-950/30" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-100/50 blur-3xl dark:bg-violet-950/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                type: 'spring',
                stiffness: 200,
              }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
            >
              <Lock
                className="h-8 w-8 text-amber-600 dark:text-amber-400"
                strokeWidth={1.5}
              />
            </motion.div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Password Change Required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Your administrator has required you to update your credentials
              before accessing the platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock
                    className={cn(
                      'h-4 w-4',
                      errors.newPassword
                        ? 'text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  {...register('newPassword')}
                  className={cn(
                    'block w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    'dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500',
                    'dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20',
                    errors.newPassword
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {/* Segments */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all duration-300',
                        strength >= level
                          ? strengthColors[strength]
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    />
                  ))}
                </div>
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    strengthTextColors[strength]
                  )}
                >
                  {strengthLabels[strength]}
                </p>
              </motion.div>
            )}

            {/* Requirements Checklist */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
              >
                {requirements.map((req) => {
                  const met = req.test(newPassword);
                  return (
                    <motion.div
                      key={req.label}
                      className="flex items-center gap-2"
                      animate={{ opacity: 1 }}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                          met
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                        )}
                      >
                        {met ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : (
                          <X className="h-2.5 w-2.5" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs transition-colors duration-200',
                          met
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {req.label}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <ShieldCheck
                    className={cn(
                      'h-4 w-4',
                      errors.confirmPassword
                        ? 'text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                  className={cn(
                    'block w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    'dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500',
                    'dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20',
                    errors.confirmPassword
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.confirmPassword.message}
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
                'dark:focus:ring-offset-slate-900',
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
                  <span>Updating password…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  <span>Update Password & Continue</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Your password will be securely encrypted and stored
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
