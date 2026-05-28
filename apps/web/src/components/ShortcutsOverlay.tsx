import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@utils/cn';

/* ---------------------------------------------------------------------------
 * ShortcutsOverlay — `?` opens a sheet listing every global keyboard
 * shortcut. Pure reference; the actual key bindings live next to the
 * features that own them (CommandPalette, useNavShortcuts).
 * ------------------------------------------------------------------------- */

const GROUPS: Array<{ title: string; rows: Array<{ keys: string[]; label: string }> }> = [
  {
    title: '전역',
    rows: [
      { keys: ['⌘', 'K'], label: '명령 팔레트 열기' },
      { keys: ['Ctrl', 'K'], label: '명령 팔레트 (Win/Linux)' },
      { keys: ['/'], label: '명령 팔레트' },
      { keys: ['?'], label: '이 도움말' },
      { keys: ['Esc'], label: '다이얼로그 닫기' },
    ],
  },
  {
    title: '네비게이션 — g 다음에',
    rows: [
      { keys: ['g', 'h'], label: '홈' },
      { keys: ['g', 'b'], label: '둘러보기' },
      { keys: ['g', 'd'], label: '대시보드' },
      { keys: ['g', 's'], label: '판매 페이지' },
      { keys: ['g', 'l'], label: '로그인' },
    ],
  },
  {
    title: '카탈로그 (Browse)',
    rows: [
      { keys: ['←'], label: '이전 페이지' },
      { keys: ['→'], label: '다음 페이지' },
      { keys: ['j'], label: '다음 카드 포커스' },
      { keys: ['k'], label: '이전 카드 포커스' },
    ],
  },
  {
    title: '작업',
    rows: [
      { keys: ['c'], label: '새 리스팅 작성 (로그인 시)' },
      { keys: ['⌘', 'D'], label: '위시리스트 토글 (상세 페이지)' },
    ],
  },
];

export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (t.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA') return;
      }
      e.preventDefault();
      setOpen((v) => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 dark:bg-night/70 backdrop-blur-md data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(540px,calc(100vw-2rem))]',
            'rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl shadow-ink/40 overflow-hidden',
            'data-[state=open]:motion-safe:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line dark:border-night-line">
            <div className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="inline-flex w-9 h-9 rounded-xl bg-ink dark:bg-bone text-volt-300 dark:text-ink items-center justify-center"
              >
                <Keyboard className="w-4 h-4" />
              </span>
              <div>
                <Dialog.Title className="font-display text-[1.1rem] font-semibold text-ink dark:text-bone leading-none tracking-tight">
                  키보드 단축키
                </Dialog.Title>
                <Dialog.Description className="text-[0.78rem] text-ink-mute dark:text-bone-mute leading-tight mt-0.5">
                  마우스 없이도 빠르게 돌아다니세요.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="닫기"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-sub motion-safe:transition focus-volt"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {GROUPS.map((g) => (
              <section key={g.title} className="space-y-2.5">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300">
                  {g.title}
                </p>
                <ul className="space-y-1.5">
                  {g.rows.map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-3">
                      <span className="text-[0.86rem] text-ink-soft dark:text-bone-soft">{row.label}</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        {row.keys.map((k, i) => (
                          <kbd
                            key={k + i}
                            className="font-mono text-[0.7rem] min-w-[1.6rem] h-[1.6rem] inline-flex items-center justify-center px-1.5 rounded-md border border-line dark:border-night-line bg-canvas-deep dark:bg-night-deep text-ink dark:text-bone shadow-[0_1px_0_oklch(0.5_0.018_280_/_0.3)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-line dark:border-night-line text-[0.72rem] text-ink-mute dark:text-bone-mute flex items-center justify-between">
            <span>
              <kbd className="font-mono text-[0.66rem] px-1.5 py-0.5 rounded border border-line dark:border-night-line">
                ?
              </kbd>{' '}
              로 언제든 다시 열 수 있어요.
            </span>
            <span className="font-mono uppercase tracking-[0.14em]">PromptMarket</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
