# Contributing

## 개발 환경

```bash
pnpm install
pnpm run dev
```

루트 패키지 매니저는 pnpm입니다. workspace 패키지는 루트에서 설치하고, 개별 앱/패키지는 `pnpm --filter`로 실행합니다.

## 작업 흐름

1. 작은 단위의 브랜치에서 작업합니다.
2. API, Web, shared schema 변경은 같은 PR에서 함께 맞춥니다.
3. 사용자 흐름이나 API 계약이 바뀌면 문서와 테스트를 함께 갱신합니다.
4. PR 전에는 `pnpm run verify`를 기준 검증으로 사용합니다.

## 품질 기준

| 명령 | 목적 |
| --- | --- |
| `pnpm run verify` | format, lint, typecheck, test, build |
| `pnpm run ci` | CI 기본 검증 |
| `pnpm run test:run` | Vitest 단위 테스트 |

## 코드 스타일

TypeScript strict 기준을 유지합니다. 도메인 schema, enum, 공유 타입은 `packages/shared`에 두고, 앱 내부 구현 세부사항은 각 앱 아래에 둡니다.
