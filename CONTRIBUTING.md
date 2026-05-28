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

## PR 규칙

1. PR 템플릿의 체크리스트를 모두 채웁니다.
2. PR 본문에는 아래를 남깁니다.
   - 변경 요약 및 영향 범위
   - `pnpm run verify` 실행 결과 / 주요 에러 로그
   - API 스키마/DB/디자인 변경 시 되돌림 포인트
3. `.github/workflows/coderabbit-gate.yml`가 있는 저장소는 `CodeRabbit review gate`가 `APPROVED` 상태여야 병합으로 전환합니다.
4. 코드/문서/스크린샷 증빙이 누락되면 병합을 대기합니다.
