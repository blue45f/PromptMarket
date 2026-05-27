# PromptMarket Benchmark + Feature Log

지속적으로 누적되는 작업 일지. 가장 최근 회차가 맨 위.

각 회차는 한 가지 영역을 깊게 다루고 main에 직접 푸시한다. 이미 다룬 주제는
다음 회차에서 다시 잡지 않는다.

---

## 2026-05-27T17:30 (UTC)

- **Benchmark**: [Linear · Raycast · Vercel](https://linear.app) — 모두 ⌘K 명령 팔레트를 1급 시민으로 취급한다. 결과는 단일 입력 필드 + 화살표 키 네비 + 입력 즉시 검색이라는 패턴 위에 서 있다.
- **Shipped**: `apps/web/src/components/CommandPalette.tsx` 신규. ⌘K / Ctrl+K / `/` 단축키로 열고, 빠른 작업 6종(둘러보기·트렌딩·최신·무료·판매·대시보드)과 실시간 리스팅 검색을 결합. Radix Dialog 위에 라임/잉크 디자인 토큰을 그대로 적용. Layout에 전역 마운트. 화살표 키 네비, hover sync, esc 종료 모두 동작.
- **Commit**: pending (이 회차 종료 시 sha 기록)
- **Next ideas**: (1) 리스팅 상세 페이지에 changelog 탭 + 가격 변동 스파크라인. (2) Wishlist/Collection MVP (localStorage 우선, 나중에 API 연결).
