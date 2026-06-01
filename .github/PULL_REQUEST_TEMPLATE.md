## 요약

- 변경 범위:
- 사용자 영향:
- 관련 이슈/참고:

## 변경 내역

- [ ] 기능/행동 변경
- [ ] API 변경
- [ ] 스타일/문안/번역 변경
- [ ] 테스트/안정성 강화

## 검증

- [ ] 웹: `pnpm --filter @promptmarket/web test:run`
- [ ] API: `pnpm --filter @promptmarket/api test`
- [ ] 공통: `pnpm typecheck`
- [ ] 빌드: `pnpm build` (필요 시)
- [ ] Playwright / E2E: 실행 로그 첨부

## 위험도 및 롤백

- 영향도 추정:
- 롤백 방법:

## 체크리스트

- [ ] Feature flag 또는 조건부 처리 필요성 확인
- [ ] i18n/복수 언어 대응
- [ ] 접근성 영향 최소화
- [ ] 코드 리뷰 포인트 공유 (`Diff 핵심`, `예외 케이스`, `후속 작업`)
