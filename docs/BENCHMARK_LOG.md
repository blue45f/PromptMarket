# PromptMarket Benchmark + Feature Log

지속적으로 누적되는 작업 일지. 가장 최근 회차가 맨 위.

각 회차는 한 가지 영역을 깊게 다루고 main에 직접 푸시한다. 이미 다룬 주제는
다음 회차에서 다시 잡지 않는다.

---

## 2026-05-27T18:00 (UTC) — Round 5

- **Benchmark**: [PromptBase 상세 페이지](https://promptbase.com) — "Best for / Use cases" 박스를 본문 위에 둬서 첫 인상을 정확하게 만든다. 카테고리/난이도/기법에서 자동 합성 가능한 정보이므로 API 변경 없이 충분히 만들 수 있다.
- **Shipped**: `apps/web/src/components/AudienceMatch.tsx`. 리스팅 타입(8종) × 난이도(beginner/intermediate/advanced) × 기법(11개) × 모델 셋업에서 "이런 분께 좋아요" 5-6줄과 "이럴 땐 다른 걸 보세요" counter-indicator 1-2줄을 자동 생성. 상세 페이지 Overview 탭 최상단에 마운트. 라임 체크 / 회색 마이너스로 시각 대비.
- **Commit**: `pending`
- **Next ideas**: (1) OG meta + dynamic page title (소셜 공유). (2) 검색어 하이라이트 (Browse 검색 결과 스니펫).

## 2026-05-27T17:50 (UTC) — Round 4

- **Benchmark**: [Smithery](https://smithery.ai) — MCP 디렉터리는 "Add to Claude Desktop / Cursor / Continue" 같은 클라이언트별 설치 명령을 한 카드 안에 탭으로 묶어 제공. 한 번의 복사로 즉시 사용 가능하게 만든 게 핵심.
- **Shipped**: `apps/web/src/components/InstallPanel.tsx`. 리스팅 타입(SKILL/MCP_SERVER/CLAUDE_MD/SUBAGENT/CURSOR_RULES/SLASH_COMMAND/AGENT_MD/PROMPT)에 맞춰 Claude Code · Cursor · Windsurf · MCP 클라이언트 · cURL 탭을 자동 필터링. Radix Tabs로 전환, 명령 복사 시 라임 체크 피드백. 사이드바 CTA 아래에 마운트.
- **Commit**: [`85866f4`](https://github.com/blue45f/promptmarket/commit/85866f4)
- **Next ideas**: (1) 가격 변동 스파크라인 (sales 대시보드). (2) "이런 분께 좋아요" 자동 박스 (카테고리 + 난이도 + 기법 합성).

## 2026-05-27T17:40 (UTC) — Round 3

- **Benchmark**: [GitHub · Linear · Notion](https://github.com) — `?`로 키보드 단축키 시트를 열고, `g x`로 두 글자 네비게이션을 제공한다. 인풋/textarea 위에서는 시퀀스가 발동하지 않게 가드한다.
- **Shipped**: `useNavShortcuts` 훅(타이머 1.2s, 입력 필드 가드) + `ShortcutsOverlay` 도움말 시트. `?` 키로 열리고 두 컬럼(전역 / 네비)으로 정리. `g h/b/d/s/l` 시퀀스로 홈/둘러보기/대시보드/판매/로그인 즉시 점프. Layout에 `useNavShortcuts()` 마운트.
- **Commit**: [`c8d9e1c`](https://github.com/blue45f/PromptMarket/commit/c8d9e1c)
- **Next ideas**: (1) 리스팅 상세에 "Add to Claude Code / Cursor / Windsurf" 카피 버튼 (Smithery 패턴). (2) 가격 변동 스파크라인 컴포넌트.

## 2026-05-27T17:35 (UTC) — Round 2

- **Benchmark**: [Are.na · Pinterest](https://are.na) — 두 곳 모두 "다시 와서 마저 볼 만한" 횡 스크롤 레일을 1급 패턴으로 둔다. 로그인 없이도 동작하기 위해 클라이언트 스토리지를 활용한다.
- **Shipped**: `useRecentlyViewed` 훅(localStorage 16건 캡, 슬러그 + 타임스탬프 큐) + `RecentlyViewed` 가로 레일 컴포넌트. 홈에서 Maker Spotlight 위에, 리스팅 상세에서 RelatedListings 아래에 마운트. 상세 페이지 진입 시 자동 추적, "기록 지우기" 버튼 제공. `useQueries`로 슬러그별 디테일을 캐시(staleTime 10분), 삭제된 리스팅은 조용히 드롭.
- **Commit**: [`2acc997`](https://github.com/blue45f/PromptMarket/commit/2acc997)
- **Next ideas**: (1) `?` 키 단축키 오버레이(키보드 도움말). (2) 리스팅 상세에 "이런 분께" 매칭 박스(카테고리+난이도+기법 기반 자동 카피).

## 2026-05-27T17:30 (UTC) — Round 1

- **Benchmark**: [Linear · Raycast · Vercel](https://linear.app) — 모두 ⌘K 명령 팔레트를 1급 시민으로 취급한다. 결과는 단일 입력 필드 + 화살표 키 네비 + 입력 즉시 검색이라는 패턴 위에 서 있다.
- **Shipped**: `apps/web/src/components/CommandPalette.tsx` 신규. ⌘K / Ctrl+K / `/` 단축키로 열고, 빠른 작업 6종(둘러보기·트렌딩·최신·무료·판매·대시보드)과 실시간 리스팅 검색을 결합. Radix Dialog 위에 라임/잉크 디자인 토큰을 그대로 적용. Layout에 전역 마운트. 화살표 키 네비, hover sync, esc 종료 모두 동작.
- **Commit**: [`5b77469`](https://github.com/blue45f/PromptMarket/commit/5b77469)
- **Next ideas**: (1) 리스팅 상세 페이지에 changelog 탭 + 가격 변동 스파크라인. (2) Wishlist/Collection MVP (localStorage 우선, 나중에 API 연결).
