import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@promptmarket/shared';
import { Loader2 } from 'lucide-react';
import { useRegister } from '@features/marketplace/queries';
import { cn } from '@utils/cn';

const inputClass = cn(
  'w-full rounded-lg px-3 py-2 text-sm',
  'border border-gray-200 dark:border-zinc-700',
  'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMut = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', username: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMut.mutateAsync({
        email: values.email.trim(),
        username: values.username.trim(),
        password: values.password,
      });
      navigate('/', { replace: true });
    } catch {
      /* toast handled in hook */
    }
  });

  const busy = isSubmitting || registerMut.isPending;

  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          Create account
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Join PromptMarket in seconds.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className={inputClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              {...register('username')}
              className={inputClass}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className={inputClass}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-[0.98] motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 dark:text-zinc-400 text-center">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-700 dark:text-indigo-400 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
