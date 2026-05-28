import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@promptmarket/shared';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@features/marketplace/queries';
import { usePageMeta } from '@hooks/usePageMeta';
import AuthLayout from '@components/AuthLayout';
import { cn } from '@utils/cn';

interface LocationState {
  from?: string;
}

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500',
);

const DEMO_ACCOUNTS: Array<{ email: string; role: string }> = [
  { email: 'alice@example.com', role: '판매자' },
  { email: 'bob@example.com', role: '구매자' },
  { email: 'carol@example.com', role: '판매·구매' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';
  const loginMut = useLogin();

  usePageMeta({
    title: '로그인 · PromptMarket',
    description: '계정에 로그인해 라이브러리와 셀러 대시보드에 접근하세요.',
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMut.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });
      navigate(from, { replace: true });
    } catch {
      /* toast handled in hook */
    }
  });

  const busy = isSubmitting || loginMut.isPending;

  return (
    <AuthLayout
      kicker="로그인"
      title={
        <>
          돌아오신 걸{' '}
          <span className="relative inline-block">
            <span className="relative z-10">환영해요</span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-[0.14em] h-[0.42em] bg-volt-300 dark:bg-volt-500/80 -z-0 -skew-x-6"
            />
          </span>
          .
        </>
      }
      highlight={
        <>
          오늘은 어떤 <br className="hidden sm:block" />
          드롭을 만나러 오셨나요?
        </>
      }
      description="계정에 로그인하면 라이브러리, 위시리스트, 셀러 대시보드를 사용할 수 있어요."
      altPrompt={
        <>
          아직 계정이 없으세요?{' '}
          <Link
            to="/register"
            className="text-ink dark:text-bone font-medium underline underline-offset-[3px] decoration-volt-400 hover:decoration-volt-500"
          >
            지금 회원가입
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            이메일
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@studio.dev"
            {...register('email')}
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            비밀번호
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className={inputClass}
          />
          {errors.password && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="group relative w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-ink dark:bg-bone text-bone dark:text-ink font-medium tracking-tight overflow-hidden motion-safe:transition focus-volt disabled:opacity-60"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-volt-500 translate-y-full motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
          />
          <span className="relative inline-flex items-center gap-2 group-hover:text-ink motion-safe:transition-colors">
            {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
            {busy ? '로그인 중…' : '로그인'}
          </span>
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-line dark:border-night-line">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute mb-2.5">
          데모 계정 (시드 후 사용 가능)
        </p>
        <ul className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                onClick={() => {
                  setValue('email', d.email, { shouldValidate: false });
                  setValue('password', 'password', { shouldValidate: false });
                }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] border border-line dark:border-night-line bg-canvas dark:bg-night hover:border-volt-400 dark:hover:border-volt-500/60 text-ink-soft dark:text-bone-soft motion-safe:transition focus-volt"
                title={`${d.email} / password`}
              >
                <span className="font-mono">@{d.email.split('@')[0]}</span>
                <span className="text-ink-mute dark:text-bone-mute">·</span>
                <span>{d.role}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  );
}
