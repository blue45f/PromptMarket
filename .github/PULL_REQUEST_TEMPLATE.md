<!-- 제목은 Conventional Commits 규칙을 따릅니다. 예: feat(web): add listing filters -->

## 변경 사항 요약

<!-- 무엇을, 왜 바꿨는지 1~3줄 -->

## 변경 종류

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] refactor
- [ ] test
- [ ] chore

## 영향 범위

- [ ] apps/api
- [ ] apps/web
- [ ] packages/shared
- [ ] 루트 인프라(CI, scripts, config)
- [ ] 문서

## 체크리스트

- [ ] `pnpm run verify` 통과
- [ ] API 계약 변경 시 shared schema 갱신
- [ ] 사용자 흐름 변경 시 테스트 또는 수동 확인 기록
- [ ] 문서 업데이트 필요 여부 확인

## 디자인 시스템 가드레일

- [ ] OKLCH 토큰만 사용 (라임 / 잉크 / 캔버스 / 코랄 / 바이올렛)
- [ ] 새 폰트 도입 없음 (Bricolage Grotesque / Hanken Grotesk / Pretendard Variable / JetBrains Mono)
- [ ] 그라디언트 텍스트, 사이드 스트라이프 보더, glassmorphism 남용, 동일 크기 카드 그리드만 반복 없음
- [ ] 한글 카피는 `word-break: keep-all` 유지

## CodeRabbit 메모

<!-- 자동 리뷰가 짚을 만한 부분에 미리 답을 달면 라운드가 한 번 줄어든다.
     - 의도적으로 표면을 깨는 곳이 있다면 사유
     - 의존성 변경이 있다면 마이그레이션 노트
     - 디자인 토큰을 추가했다면 어디서 재사용 가능한지 -->

## 스크린샷 / 데모

<!-- UI 변경 시 라이트/다크 + 375/768/1440 첨부 -->

<!--
머지 게이트:
1. `quality` CI 워크플로 통과
2. `CodeRabbit` 자동 리뷰가 Request changes를 남기지 않음
-->
