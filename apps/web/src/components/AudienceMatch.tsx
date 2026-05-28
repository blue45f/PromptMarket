import { Check, Minus } from 'lucide-react';
import type { Difficulty, ListingType, PromptTechnique } from '@promptmarket/shared';
import { cn } from '@utils/cn';

/* ---------------------------------------------------------------------------
 * AudienceMatch — "이런 분께 좋아요 / 이럴 땐 다른 걸 보세요" card. Synthesizes
 * fit signals from the listing's own metadata (type, category, difficulty,
 * technique, models). No API change; entirely derived from what the detail
 * page already has.
 * ------------------------------------------------------------------------- */

interface AudienceMatchProps {
  type: ListingType;
  category: string;
  difficulty?: Difficulty;
  technique?: PromptTechnique | null;
  models?: string[];
  className?: string;
}

const TYPE_AUDIENCE: Record<ListingType, { fit: string[]; mismatch: string[] }> = {
  PROMPT: {
    fit: [
      '특정 작업에 맞는 검증된 프롬프트를 바로 쓰고 싶은 분',
      '여러 모델에 동일한 입력을 던져 결과를 비교하고 싶은 분',
    ],
    mismatch: ['자동화된 에이전트 워크플로가 필요한 경우 (Skill / Sub-agent 참고)'],
  },
  CLAUDE_MD: {
    fit: [
      '프로젝트 단위 규칙으로 Claude Code의 답변 일관성을 잡고 싶은 분',
      '모노레포에서 팀 컨벤션을 코드로 박아두고 싶은 분',
    ],
    mismatch: ['에디터 비종속 룰이 필요하다면 agent.md를 보세요'],
  },
  AGENT_MD: {
    fit: ['Codex / Copilot 등 멀티 에디터에서 동일한 규칙을 쓰고 싶은 분'],
    mismatch: ['Claude 전용 워크플로는 CLAUDE.md가 더 정밀'],
  },
  SKILL: {
    fit: [
      'Claude Code 안에서 반복되는 작업을 한 줄 명령으로 만들고 싶은 분',
      '팀에 표준 절차를 배포해 일관된 산출물을 보장하고 싶은 분',
    ],
    mismatch: ['단일 프롬프트 한 컷이면 충분하다면 Prompt 카테고리가 더 가벼움'],
  },
  MCP_SERVER: {
    fit: [
      '에이전트가 외부 도구·DB·API에 닿을 수 있게 해주고 싶은 분',
      'Claude Desktop·Cursor·Continue 등 여러 클라이언트에서 같은 데이터 소스를 쓰고 싶은 분',
    ],
    mismatch: ['프롬프트만으로 해결 가능한 작업이라면 과한 선택'],
  },
  SLASH_COMMAND: {
    fit: ['자주 쓰는 프롬프트를 단축 명령으로 호출하고 싶은 분'],
    mismatch: ['장기 자율 작업이 필요하면 Sub-agent가 적합'],
  },
  SUBAGENT: {
    fit: [
      '특정 페르소나/역할을 분리해 작업을 위임하고 싶은 분',
      'Claude Code 멀티 에이전트 셋업을 구성하고 있는 분',
    ],
    mismatch: ['단발성 변환·요약이라면 Prompt로 충분'],
  },
  CURSOR_RULES: {
    fit: ['Cursor 안에서 프로젝트 어시스턴트 톤을 고정하고 싶은 분'],
    mismatch: ['에디터에 종속되지 않는 규칙이 필요하면 agent.md를 보세요'],
  },
};

const DIFFICULTY_TONE: Record<Difficulty, { fit: string; mismatch: string }> = {
  beginner: {
    fit: '입문자도 바로 적용하기 쉬워요',
    mismatch: '고급 옵션·세팅을 기대하는 분께는 가벼울 수 있어요',
  },
  intermediate: {
    fit: '기본 사용 경험이 있는 분에게 적당한 난이도',
    mismatch: '완전 초보자는 약간의 셋업이 필요할 수 있어요',
  },
  advanced: {
    fit: '깊은 커스터마이즈가 필요한 시니어/팀에 적합',
    mismatch: '입문자는 우선 같은 카테고리의 beginner 리스팅을 보세요',
  },
};

const TECHNIQUE_HINT: Partial<Record<NonNullable<PromptTechnique>, string>> = {
  'chain-of-thought': '문제 분해와 단계별 추론을 유도하는 패턴',
  'tree-of-thoughts': '여러 추론 경로를 가지치기하며 비교',
  'few-shot': '예제 몇 개로 빠르게 톤·형식 학습',
  'zero-shot': '예시 없이 지시만으로 동작',
  'role-prompt': '특정 페르소나로 답변 톤 고정',
  react: '추론과 도구 사용을 번갈아 진행 (ReAct)',
  rag: '외부 문서/데이터를 끌어와 답변 (RAG)',
  reflexion: '답변 후 스스로 검증·수정 루프',
  'self-consistency': '여러 샘플의 다수결로 안정성 확보',
  'plan-and-solve': '먼저 계획을 세우고 단계 실행',
  'meta-prompt': '프롬프트를 위한 프롬프트',
};

function modelHint(models: string[] | undefined) {
  if (!models || models.length === 0) return null;
  if (models.includes('any')) return '모델 비종속 — 어디서 쓰든 동작';
  if (models.length === 1) return `${models[0]} 전용으로 다듬어졌어요`;
  return `${models.length}개 모델에 최적화 — 비교 실험에 좋아요`;
}

export default function AudienceMatch({
  type,
  category,
  difficulty,
  technique,
  models,
  className,
}: AudienceMatchProps) {
  const typeBucket = TYPE_AUDIENCE[type];
  const diffBucket = difficulty ? DIFFICULTY_TONE[difficulty] : null;
  const techHint = technique ? TECHNIQUE_HINT[technique] : null;
  const modelLine = modelHint(models);

  const fits = [
    ...typeBucket.fit,
    diffBucket?.fit ?? null,
    techHint ? `프롬프트 기법: ${techHint}` : null,
    modelLine,
    category ? `${category} 카테고리 작업이 잦은 분` : null,
  ].filter((s): s is string => !!s);

  const mismatches = [...typeBucket.mismatch, diffBucket?.mismatch].filter(
    (s): s is string => !!s,
  );

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-5 h-px bg-volt-500" />
          이런 분께
        </span>
      </div>
      <ul className="space-y-2.5">
        {fits.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[0.92rem] leading-snug">
            <span
              aria-hidden
              className="mt-0.5 shrink-0 inline-flex w-4 h-4 rounded-full bg-volt-300 text-ink items-center justify-center"
            >
              <Check className="w-3 h-3" />
            </span>
            <span className="text-ink dark:text-bone">{line}</span>
          </li>
        ))}
      </ul>

      {mismatches.length > 0 && (
        <>
          <div className="mt-5 mb-3 inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
            <span aria-hidden className="w-5 h-px bg-ink-mute/60 dark:bg-bone-mute/60" />
            이럴 땐 다른 걸 보세요
          </div>
          <ul className="space-y-2">
            {mismatches.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[0.86rem] leading-snug text-ink-mute dark:text-bone-mute"
              >
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 inline-flex w-4 h-4 rounded-full border border-line dark:border-night-line items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
