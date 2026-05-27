import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@promptmarket/shared';
import { Loader2 } from 'lucide-react';
import { useRegister } from '@features/marketplace/queries';
import { usePageMeta } from '@hooks/usePageMeta';
import AuthLayout from '@components/AuthLayout';
import { cn } from '@utils/cn';

const inputClass = cn(
  'w-full rounded-xl px-3.5 py-2.5 text-sm',
  'border border-line dark:border-night-line',
  'bg-canvas dark:bg-night text-ink dark:text-bone',
  'placeholder:text-ink-mute dark:placeholder:text-bone-mute',
  'motion-safe:transition',
  'focus:outline-none focus:ring-2 focus:ring-volt-500/60 focus:border-volt-500',
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMut = useRegister();

  usePageMeta({
    title: '회원가입 · PromptMarket',
    description: '몇 초면 끝나요. PromptMarket에 가입하고 카탈로그를 활용하세요.',
  });

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
    <AuthLayout
      kicker="회원가입"
      title={
        <>
          몇 초면{' '}
          <span className="relative inline-block">
            <span className="relative z-10">시작</span>
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
          빌더가 되고 싶으세요?{' '}
          <br className="hidden sm:block" />
          여기서부터 출발이에요.
        </>
      }
      description="이메일과 사용자명만 있으면 끝. 가입 즉시 라이브러리·위시리스트·셀러 대시보드 모두 사용할 수 있어요."
      altPrompt={
        <>
          이미 가입하셨나요?{' '}
          <Link
            to="/login"
            className="text-ink dark:text-bone font-medium underline underline-offset-[3px] decoration-volt-400 hover:decoration-volt-500"
          >
            로그인
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
            사용자명
          </label>
          <input
            type="text"
            autoComplete="username"
            placeholder="hjunkim"
            {...register('username')}
            className={inputClass}
          />
          {errors.username && (
            <p className="mt-1.5 text-[0.78rem] text-coral-deep dark:text-coral">{errors.username.message}</p>
          )}
          <p className="mt-1 text-[0.72rem] text-ink-mute dark:text-bone-mute">
            프로필 URL에 그대로 쓰여요: /users/<span className="font-mono">사용자명</span>
          </p>
        </div>
        <div>
          <label className="block text-[0.82rem] font-medium text-ink dark:text-bone mb-1.5">
            비밀번호
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="최소 8자"
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
            {busy ? '계정 만드는 중…' : '계정 만들기'}
          </span>
        </button>

        <p className="text-[0.72rem] text-ink-mute dark:text-bone-mute leading-relaxed">
          가입하면 PromptMarket의 셀러 약관 및 개인정보 처리 방침에 동의하는 것으로 간주돼요.
        </p>
      </form>
    </AuthLayout>
  );
}
