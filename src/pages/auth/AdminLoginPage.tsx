import { useState, useRef } from 'react';
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
  Shield,
  AlertTriangle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  pin: z
    .string()
    .min(4, 'Security PIN must be 4 digits')
    .max(4, 'Security PIN must be 4 digits')
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PIN input refs
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      pin: '',
    },
  });

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);
    setValue('pin', newDigits.join(''), { shouldValidate: true });

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    setValue('pin', newDigits.join(''), { shouldValidate: true });
    if (pasted.length < 4) {
      pinRefs.current[pasted.length]?.focus();
    } else {
      pinRefs.current[3]?.focus();
    }
  };

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminLogin(data.email, data.password, data.pin);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.message || 'Authentication failed. Please verify your credentials and PIN.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-600/5 blur-2xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-3 backdrop-blur-sm"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            strokeWidth={1.5}
          />
          <p className="text-sm text-amber-200/80">
            This portal requires elevated administrative credentials
          </p>
        </motion.div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            {/* Animated Shield Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.15,
                type: 'spring',
                stiffness: 200,
              }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 ring-1 ring-indigo-500/20"
            >
              <motion.div
                animate={{
                  rotateY: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                }}
              >
                <Shield
                  className="h-8 w-8 text-indigo-400"
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.div>

            <h2 className="text-xl font-bold tracking-tight text-white">
              Secure Administrator Console
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Multi-factor authentication required
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
                <div className="flex items-start gap-3 rounded-xl border border-red-800/50 bg-red-950/50 px-4 py-3">
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-slate-300"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail
                    className={cn(
                      'h-4 w-4',
                      errors.email ? 'text-red-400' : 'text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@amplifi.dev"
                  {...register('email')}
                  className={cn(
                    'block w-full rounded-xl border bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    errors.email
                      ? 'border-red-700'
                      : 'border-slate-700'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock
                    className={cn(
                      'h-4 w-4',
                      errors.password ? 'text-red-400' : 'text-slate-500'
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={cn(
                    'block w-full rounded-xl border bg-slate-800/50 py-2.5 pl-10 pr-11 text-sm text-white shadow-sm transition-colors placeholder:text-slate-500',
                    'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    errors.password
                      ? 'border-red-700'
                      : 'border-slate-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Security PIN */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                  Security PIN
                </span>
              </label>
              {/* Hidden input for form */}
              <input type="hidden" {...register('pin')} />
              <div className="flex justify-center gap-3" onPaste={handlePinPaste}>
                {[0, 1, 2, 3].map((index) => (
                  <motion.input
                    key={index}
                    ref={(el) => {
                      pinRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={pinDigits[index]}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    className={cn(
                      'h-12 w-12 rounded-xl border bg-slate-800/50 text-center text-lg font-bold text-white shadow-sm transition-all',
                      'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                      errors.pin ? 'border-red-700' : 'border-slate-700',
                      pinDigits[index] && 'border-indigo-600/50 bg-indigo-950/30'
                    )}
                  />
                ))}
              </div>
              {errors.pin && (
                <p className="text-center text-xs text-red-400">
                  {errors.pin.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all',
                'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
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
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" strokeWidth={1.5} />
                  <span>Authenticate</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Protected by Amplifi Security · All access is monitored and logged
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
