# PromptMarket Benchmark + Feature Log

지속적으로 누적되는 작업 일지. 가장 최근 회차가 맨 위.

각 회차는 한 가지 영역을 깊게 다루고 main에 직접 푸시한다. 이미 다룬 주제는
다음 회차에서 다시 잡지 않는다.

---

## 2026-05-27T18:45 (UTC) — Round 9

- **Benchmark**: [Linear · Vercel · Stripe 로그인](https://linear.app/login) — 폼 + 브랜드 가치 제안을 좌우로 분할한 스플릿 레이아웃. 가입 직전이 첫인상을 결정하는 페이지인데도 보통 무성의하게 두는 곳을 멋지게 다뤘다.
- **Shipped**: 공용 `AuthLayout` 컴포넌트(좌측 폼 / 우측 ambient mesh + 가치 제안 카드). Login은 데모 계정 3종 빠른 채우기 칩(alice / bob / carol) 포함. Register는 사용자명 → 프로필 URL 힌트 문구. 두 페이지 모두 라임 슬라이드 인 호버 CTA, ⌘K 가이드, OG/Twitter 메타까지 자동 세팅.
- **Commit**: `pending`
- **Next ideas**: (1) Browse empty state 강화 (검색어 + 활성 필터 인사이트). (2) "구매한 라이브러리" 빈 상태 톤업.

## 2026-05-27T18:30 (UTC) — Round 8

- **Benchmark**: [GitHub · Linear · Vercel 404 페이지](https://github.com/404) — 좋은 404는 사과만 하지 않는다. 사용자가 갈 만한 다음 위치 3-4개를 제안하고 검색 진입점을 노출한다.
- **Shipped**: NotFound 페이지를 새 디자인 시스템으로 재작성. Hero 비대칭 헤드라인("이 페이지는 카탈로그에 없어요" + 라임 하이라이트), 커서 스포트라이트, ambient mesh, 그레인. 빠른 작업 4종(둘러보기/트렌딩/최신/무료) + ⌘K 팔레트 열기 버튼. RecentlyViewed 마운트로 방문자 기억까지 챙김. `usePageMeta`로 적절한 404 타이틀, `data-status="404"` 어트리뷰트로 임베더 힌트.
- **Commit**: [`eaef076`](https://github.com/blue45f/promptmarket/commit/eaef076)
- **Next ideas**: (1) 로그인/회원가입 페이지 새 디자인 적용. (2) Browse 결과가 0건일 때 empty state 강화.

## 2026-05-27T18:20 (UTC) — Round 7

- **Benchmark**: [Algolia · GitHub 검색 결과](https://algolia.com) — 매칭 토큰을 카드 안에 형광 배경 대신 얇은 라임 언더라인으로 표시하면 가독성을 해치지 않으면서 발견성을 높인다.
- **Shipped**: `apps/web/src/components/Highlight.tsx` — 공백 기준으로 토큰 분할, 케이스 인센시티브 정규식 매치, 각 매치를 `<mark>`로 감싸 라임 언더라인 부여. `ListingCard`에 `highlight?: string` prop 추가. Browse 결과 그리드에서 `q`가 있을 때 모든 카드에 자동 적용. 다른 모든 호출처는 그대로 동작.
- **Commit**: [`cc6f231`](https://github.com/blue45f/promptmarket/commit/cc6f231)
- **Next ideas**: (1) 404/offline 페이지 톤업. (2) 푸터 SEO sitemap.xml/robots.txt 생성 라우트.

## 2026-05-27T18:10 (UTC) — Round 6

- **Benchmark**: [Vercel · Linear 공유 카드](https://vercel.com) — 두 곳 모두 OG 메타와 동적 페이지 타이틀을 1급으로 다룬다. SPA여도 클라이언트 사이드에서 document.head를 업데이트하면 슬랙/iMessage/트위터 공유 시 적절한 카드가 뜬다.
- **Shipped**: `usePageMeta` 훅 — title, description, og:* / twitter:* / canonical을 한 번에 관리. unmount 시 이전 타이틀 복원. ListingDetail에는 리스팅 제목 + 설명 + canonical URL, Home에는 브랜드 기본값, Browse에는 검색어/카테고리/정렬을 반영한 동적 타이틀("...검색 결과" / "...카탈로그" / "트렌딩")을 자동 설정.
- **Commit**: [`d159970`](https://github.com/blue45f/promptmarket/commit/d159970)
- **Next ideas**: (1) Browse 검색 결과 스니펫 하이라이트. (2) 404/offline 페이지 톤업.

## 2026-05-27T18:00 (UTC) — Round 5

- **Benchmark**: [PromptBase 상세 페이지](https://promptbase.com) — "Best for / Use cases" 박스를 본문 위에 둬서 첫 인상을 정확하게 만든다. 카테고리/난이도/기법에서 자동 합성 가능한 정보이므로 API 변경 없이 충분히 만들 수 있다.
- **Shipped**: `apps/web/src/components/AudienceMatch.tsx`. 리스팅 타입(8종) × 난이도(beginner/intermediate/advanced) × 기법(11개) × 모델 셋업에서 "이런 분께 좋아요" 5-6줄과 "이럴 땐 다른 걸 보세요" counter-indicator 1-2줄을 자동 생성. 상세 페이지 Overview 탭 최상단에 마운트. 라임 체크 / 회색 마이너스로 시각 대비.
- **Commit**: [`33b7881`](https://github.com/blue45f/promptmarket/commit/33b7881)
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
