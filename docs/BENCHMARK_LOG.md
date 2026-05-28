# PromptMarket Benchmark + Feature Log

지속적으로 누적되는 작업 일지. 가장 최근 회차가 맨 위.

각 회차는 한 가지 영역을 깊게 다루고 main에 직접 푸시한다. 이미 다룬 주제는
다음 회차에서 다시 잡지 않는다.

---

## 2026-05-28T15:20 (UTC) — Round 81

- **Benchmark**: [Pinterest · Are.na 키보드 저장](https://pinterest.com) — 위시리스트 / 즐겨찾기 토글은 손이 자주 가는 액션. 브라우저의 "이 페이지 북마크" 단축키(⌘D)를 in-app에서 더 의미있게 재사용하는 게 power user 패턴.
- **Shipped**: ListingDetail에서 ⌘D / Ctrl+D 시 `useWishlist.toggle(slug)`. 입력 필드 위에서는 발동 안 함(브라우저 기본 동작 유지). 카드 ♡, 사이드바 inline 풀, 대시보드 탭에 이어 네 번째 위시리스트 진입점. ShortcutsOverlay "작업" 그룹에 표기.
- **Commit**: `pending`
- **Next ideas**: (1) ModelTabs 단위 테스트. (2) Footer Anthology 라벨 hover 시 cycle vol.01 → vol.02.

## 2026-05-28T15:10 (UTC) — Round 80

- **Benchmark**: [Gumroad · Notion 발행 폼 임시저장](https://gumroad.com) — 긴 본문을 쓰다가 실수로 탭이 닫히면 흐름이 끊기고 다시 안 돌아오는 셀러가 생긴다. 임시저장이 기본값이어야 한다.
- **Shipped**: CreateListing 폼 draft autosave — `watch()` 결과를 600ms 디바운스로 `pm.sellDraft` localStorage에 저장, 마운트 시 자동 hydrate. 저장된 draft가 복원된 경우에만 상단에 라임 카드 노출 + "새로 시작" 버튼으로 폼 reset + key 제거. 게시 성공 시 자동으로 draft 키 삭제.
- **Commit**: `pending`
- **Next ideas**: (1) Detail 페이지 ⌘D = 위시리스트 토글. (2) ModelTabs 단위 테스트.

## 2026-05-28T14:58 (UTC) — Round 79

- **Benchmark**: 자체 — 키보드 단축키는 사용자 경험의 가장 미세한 침해/방해를 발생시키기 쉬운 영역(예: 입력 필드 위 g가 navigate 트리거되면 사용자가 한 글자를 잃음). 회귀 보호선 필수.
- **Shipped**: `useNavShortcuts.test.tsx` 5건 — g b → /browse / g h → / / 인증 시 c → /sell / 미인증 시 c는 무시 / input 위에서 g b 시퀀스 차단. MemoryRouter + useAuthStore + KeyboardEvent dispatch로 통합 검증. 50 tests / 14 files green.
- **Commit**: `pending`
- **Next ideas**: (1) /sell 폼 draft autosave (localStorage). (2) ModelTabs 단위 테스트.

## 2026-05-28T14:45 (UTC) — Round 78

- **Benchmark**: [WAI-ARIA combobox 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — 검색 드롭다운이 마우스만 받으면 절반의 사용자에게 비활성. ↑↓로 이동, Enter로 선택, Esc로 닫는 게 표준.
- **Shipped**: SearchBar input에 `role=combobox` + `aria-expanded` + `aria-activedescendant`, dropdown 옵션마다 `role=option` + `aria-selected`. `handleInputKey`가 ↑↓ 회전 + Enter 선택 + Esc 닫기를 처리. active row는 라임 fill로 시각 표시, hover와 키보드 둘 다 같은 상태를 갱신.
- **Commit**: `pending`
- **Next ideas**: (1) ModelTabs 단위 테스트. (2) Hero 헤드라인 의도적 line-break 명시.

## 2026-05-28T14:32 (UTC) — Round 77

- **Benchmark**: 자체 — `j`/`k`로 카드를 포커스해도 어포던스(하트 + 화살표)가 안 뜨면 키보드 사용자에게는 사실상 비활성 상태로 보인다. hover와 focus-within이 동일한 시각 신호를 내야 한다.
- **Shipped**: ListingCard 호버 어포던스(♡ wishlist 토글 + 화살표 인디케이터)와 제목 hover-color에 `group-focus-within:` 변형 추가. 키보드 포커스가 카드 내부 anchor에 들어오면 호버와 동일한 노출. motion-safe 조합 유지.
- **Commit**: `pending`
- **Next ideas**: (1) ModelTabs 단위 테스트. (2) SearchBar 드롭다운 키보드 ↓↑ 네비.

## 2026-05-28T14:22 (UTC) — Round 76

- **Benchmark**: [WAI-ARIA radiogroup 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) — 토글 그룹은 tab + space만 지원하면 스크린리더 사용자가 모든 옵션을 일일이 tab해야 한다. radiogroup으로 묶고 ←/→로 안에서 이동 + 활성만 tabIndex=0이 표준.
- **Shipped**: FilterPanel 난이도 + 가격 토글 그룹을 `role="radiogroup"` + 각 버튼 `role="radio"` + `aria-checked` + roving tabindex로 재구성. `handleArrowGroupKey` 유틸이 ←/→ 키로 옵션을 순환하면서 set + focus 동시에 처리. 마우스/터치 흐름은 그대로 유지.
- **Commit**: `pending`
- **Next ideas**: (1) ModelTabs 컴포넌트 단위 테스트. (2) ListingCard hover effect a11y(키보드 focus도 효과 발동).

## 2026-05-28T14:10 (UTC) — Round 75

- **Benchmark**: 자체 — CategoryChips는 카탈로그 진입의 첫 분기이고 shared CATEGORIES 변경 시 가장 먼저 깨질 위치다. 단순한 렌더 테스트만으로도 회귀 보호선이 한 단계 굵어진다.
- **Shipped**: `CategoryChips.test.tsx` 3건 — CATEGORIES 전체에 대한 chip + "전체" reset 렌더 / active prop이 해당 chip에 ink fill 적용 / active 없을 때 "전체"가 active로 표시. 45 tests / 13 files green.
- **Commit**: `pending`
- **Next ideas**: (1) ModelTabs 단위 테스트. (2) FilterPanel toggle group 키보드 좌우 이동.

## 2026-05-28T13:58 (UTC) — Round 74

- **Benchmark**: [Linear · Vimium · GitHub 키보드 워크플로](https://linear.app) — 마우스 없이 카탈로그를 빠르게 훑을 수 있어야 power user가 끝까지 머문다. j/k가 vim convention이고 ⌘K + ←/→와 충돌 안 함.
- **Shipped**: Browse 결과 그리드의 `j` (다음 카드) / `k` (이전 카드) 키보드 네비게이션. 입력 필드 위에서는 발동 안 함, 카드 포커스 + `scrollIntoView`로 자동 스크롤 따라감. 결과 카드 div에 `data-browse-card` 셀렉터 부착. ShortcutsOverlay에도 새 바인딩 표기.
- **Commit**: `pending`
- **Next ideas**: (1) Enter 키로 포커스된 카드 열기 (이미 anchor이라 동작하지만 명시). (2) CategoryChips 단위 테스트.

## 2026-05-28T13:46 (UTC) — Round 73

- **Benchmark**: [Notion · Twitter mobile tab strip](https://twitter.com) — 좁은 화면에서 탭이 줄바꿈되면 시각 위계가 무너진다. 1 row 가로 스크롤 + 가장자리 여백 그라데이션이 표준 패턴.
- **Shipped**: ListingDetail `Tabs.List`에 `overflow-x-auto`, `scrollbar-hide`, 모바일에서만 `-mx-[clamp(...)] px-[clamp(...)]`로 가장자리까지 밀착하고, 트리거에 `shrink-0 whitespace-nowrap`을 더해 wrap 방지. `aria-label`도 한국어로. focus-volt 적용해 키보드 사용자 가시성도 일관.
- **Commit**: `pending`
- **Next ideas**: (1) ListingCard 본문 모바일 truncation 라인 수 1줄로 축소. (2) Top-of-page progress bar polish (Hero 안에서만 active).

## 2026-05-28T13:35 (UTC) — Round 72

- **Benchmark**: [Google · Naver 검색창 드롭다운](https://google.com) — 검색창에 포커스가 들어왔을 때 최근 검색이 자동으로 펼쳐지면 키 입력 없이 재방문이 가능. 단, 검색창 밖 클릭 / 검색어 입력 시 즉시 사라져야 시야가 깔끔.
- **Shipped**: SearchBar 리팩토링 — `useSearchHistory` 연결, focus + empty input일 때만 dropdown 노출, mousedown preventDefault로 옵션 클릭 시 input blur로 인한 자동 닫힘 방지, document mousedown으로 외부 클릭 시 닫음. commit 시 `history.record(trimmed)`로 검색어 영구 저장. 각 항목에 hover-만 노출 ✕ 버튼으로 개별 삭제 가능, 헤더에 "지우기" 전체 삭제. SearchBar는 Navbar + Browse + mobile drawer 어디서든 같은 history 공유.
- **Commit**: `pending`
- **Next ideas**: (1) ListingDetail Tabs 모바일 가로 스크롤. (2) Notification toast 디자인 토큰 추가 검증.

## 2026-05-28T13:22 (UTC) — Round 71

- **Benchmark**: [Raycast · Linear 검색 히스토리](https://raycast.com) — 명령 팔레트는 같은 검색을 반복적으로 던지는 경향이 있다. 직전 몇 개만 다시 한 번 클릭으로 띄울 수 있으면 키 입력 수가 확연히 줄어든다.
- **Shipped**: `useSearchHistory` 훅 (localStorage 8건 cap, MRU 정렬, dedupe, CustomEvent fanout) + 단위 테스트 5건. CommandPalette는 (1) 입력이 비어 있을 때만 상단에 "최근 검색" chip 줄을 노출하고, (2) 입력 onBlur에 record를 호출해서 사용자가 결과를 본 검색만 저장. "지우기" 버튼은 전체 history를 비움. 42 tests / 12 files green.
- **Commit**: [`680e288`](https://github.com/blue45f/promptmarket/commit/680e288)
- **Next ideas**: (1) Browse SearchBar에서도 history 노출. (2) ListingDetail Tabs 모바일 가로 스크롤.

## 2026-05-28T13:08 (UTC) — Round 70

- **Benchmark**: 자체 — `<Highlight />`는 사용자 입력을 정규식으로 합성하기 때문에 escape를 안 하면 검색어에 `(`나 `.`이 들어왔을 때 터지거나 잘못 매치된다. 코드 한 줄짜리 버그라도 통째로 뷰가 비는 결과로 이어짐.
- **Shipped**: `Highlight.test.tsx` 5건 — 빈 query passthrough / 대소문자 무시 + 원본 케이스 유지 / 공백 토큰화 / 정규식 특수문자 escape / 빈 text 안전. 37 tests / 11 files green.
- **Commit**: `pending`
- **Next ideas**: (1) CommandPalette 검색 히스토리. (2) ListingDetail Tabs 모바일 가로 스크롤.

## 2026-05-28T12:55 (UTC) — Round 69

- **Benchmark**: 자체 — useReveal는 IntersectionObserver + matchMedia 두 브라우저 API에 의존한다. jsdom은 matchMedia를 제공하지 않아 다른 훅 테스트가 우연히 통과한 케이스도 있을 수 있다 — 폴리필을 setup에 깔아두면 모든 훅이 일관된 가정 위에서 돈다.
- **Shipped**: `apps/web/src/test/setup.ts`에 matchMedia 폴리필 추가(기본 `matches=false`, 개별 테스트가 패치 가능). `useReveal.test.ts` 2건 — 초기 false + null ref / prefers-reduced-motion 시 즉시 true. 32 tests / 10 files green.
- **Commit**: `pending`
- **Next ideas**: (1) useNavShortcuts/useSpotlight/useTilt 테스트. (2) Hero KineticHeadline e2e snapshot.

## 2026-05-28T12:42 (UTC) — Round 68

- **Benchmark**: 자체 — useCountUp는 IntersectionObserver + rAF가 얽혀 단위 테스트로는 핵심 애니메이션 경로를 직접 검증하기 까다롭다. 그래도 ref 안정성/초기값/계약 자체는 회귀 보호 가치가 있음.
- **Shipped**: `useCountUp.test.ts` 3건 — 초기 0 + null ref / rerender 시 ref 동일성 / 커스텀 duration 안전. 30 tests / 9 files green.
- **Commit**: `pending`
- **Next ideas**: (1) useReveal 단위 테스트. (2) Footer mega wordmark hover에 라임 acceleration.

## 2026-05-28T12:28 (UTC) — Round 67

- **Benchmark**: 자체 — useWishlist/useSavedFilters는 단위 테스트로 잠궜고, useRecentlyViewed만 비어 있었다. 같은 패턴(localStorage + CustomEvent)이라 동일한 면 채워 두면 회귀 보호선이 일관된다.
- **Shipped**: `useRecentlyViewed.test.ts` 5건 — 빈 시작 / 최신 우선 + 디듀프 / 16개 캡 / clear / CustomEvent로 다중 구독 동기화. 27 tests / 8 files green.
- **Commit**: `pending`
- **Next ideas**: (1) ListingCard에 Compose Lighthouse smoke check. (2) Hero KineticHeadline 시각 회귀 (snapshot).

## 2026-05-28T12:15 (UTC) — Round 66

- **Benchmark**: 자체 — JSON-LD는 SEO 영향을 직접 측정하기 어려우니, 회귀 잡는 테스트가 더 큰 안전망이 된다.
- **Shipped**: `apps/web/src/hooks/useStructuredData.test.ts` 4건 — 1 script inject + JSON content / unmount cleanup / null이면 no-op / 데이터 변경 시 중복 없이 교체. `data-source="promptmarket-structured"` 속성으로 다른 페이지의 무관한 ld+json과 격리. 22 tests / 7 files green.
- **Commit**: `pending`
- **Next ideas**: (1) useRecentlyViewed 단위 테스트. (2) Hero 드롭 마키 e2e smoke.

## 2026-05-28T12:05 (UTC) — Round 65

- **Benchmark**: 자체 — `usePageMeta`가 head DOM을 직접 만지고 unmount 시 복원한다. mock 없이 jsdom으로 확인하는 게 가장 빠르고 정확.
- **Shipped**: `apps/web/src/hooks/usePageMeta.test.ts` 5건 — title 설정+복원 / description+og:title+og:type / og:image 있을 때 twitter:card=summary_large_image 업그레이드 / canonical link 출력 / og:image 없을 때 summary 폴백. afterEach가 hook이 append한 노드 전부 청소해 테스트 간 격리. 합계 18 tests / 6 files green.
- **Commit**: `pending`
- **Next ideas**: (1) useStructuredData 단위 테스트. (2) Hero KineticHeadline의 reduced-motion 케이스 시각 확인.

## 2026-05-28T11:55 (UTC) — Round 64

- **Benchmark**: 자체 — Browse 빈 상태는 사용자가 막힌 흐름을 푸는 가장 직접적인 도구다. `buildActiveFilterRows`가 깨지면 사용자 입장에서 "왜 결과가 없는지 알 수 없다"는 최악의 경험으로 전락. 회귀 보호 필수.
- **Shipped**: `apps/web/src/components/BrowseEmptyState.test.ts` 4건 (empty / all dimensions / per-row remove callback forwarding / price=all omit). 합계 13 tests pass.
- **Commit**: `pending`
- **Next ideas**: (1) usePageMeta unit test. (2) Footer wordmark hover에 라임 acceleration.

## 2026-05-28T11:42 (UTC) — Round 63

- **Benchmark**: [Notion · Substack 긴 글 스크롤 컨트롤](https://substack.com) — 긴 본문에서 맨 위로 돌아가는 동작은 키보드 사용자에게는 `Home`, 마우스 사용자에게는 작은 떠 있는 풀이 표준. 둘 다 막히면 답답하다.
- **Shipped**: `apps/web/src/components/ScrollToTop.tsx` — 600px scroll threshold, rAF로 스로틀, smooth scroll(reduced-motion 시 instant), iOS safe-area-inset-bottom 대응. Layout에 마운트해 모든 라우트에 전역으로 적용. 비활성 시 `pointer-events-none` + `tabIndex=-1`로 키보드 흐름 깔끔하게 유지.
- **Commit**: `pending`
- **Next ideas**: (1) BrowseEmptyState `buildActiveFilterRows` 유닛 테스트. (2) FilterPanel 토글 그룹 키보드 좌우 이동.

## 2026-05-28T11:30 (UTC) — Round 62

- **Benchmark**: [GitHub · Stack Overflow sitelinks search box](https://schema.org/SearchAction) — 도메인이 어느 정도 인지도가 생기면 SERP에 자체 검색박스가 같이 노출될 수 있는데, 그러려면 WebSite + SearchAction JSON-LD가 반드시 필요.
- **Shipped**: HomePage에 WebSite + SearchAction 스키마 inject. `urlTemplate: /browse?q={search_term_string}`, `query-input: required name=search_term_string`. inLanguage="ko-KR". Listing detail의 Product 스키마와 함께 Google에서 organic listing 품질이 올라가는 신호.
- **Commit**: `pending`
- **Next ideas**: (1) Listing detail "맨 위로" 버튼. (2) BrowseEmptyState `buildActiveFilterRows` 테스트.

## 2026-05-28T11:20 (UTC) — Round 61

- **Benchmark**: [Etsy · Gumroad rich product results](https://etsy.com) — OG 메타로는 social share만 풍부해진다. Google 검색 결과에 별점/가격이 표시되려면 JSON-LD가 필요. 작은 추가지만 시간이 지날수록 organic traffic 차이가 누적.
- **Shipped**: `useStructuredData` 훅 — mount 시 `<script type="application/ld+json">` 헤드에 주입, unmount 시 제거. ListingDetail에서 Product + Offer + AggregateRating(리뷰 ≥1) 스키마를 합성해서 inject. canonical URL과 일관, reviewCount 0 케이스는 AggregateRating 자체를 omit해서 잘못된 별점 노출 방지.
- **Commit**: `pending`
- **Next ideas**: (1) 홈에 WebSite/SearchAction 구조화 데이터. (2) Listing detail 상단에 ScrollToTop 버튼.

## 2026-05-28T11:05 (UTC) — Round 59

- **Benchmark**: 자체 — 디자인 시스템 + 의존성 메이저 라운드 이후 기존 vitest 2개만 남아 있음. localStorage 기반 훅 두 개에 가벼운 unit test를 박아 두면 회귀가 컴포넌트 단까지 올라오기 전에 잡힘.
- **Shipped**: `useWishlist.test.ts`(3 tests: toggle/순서/clear) + `useSavedFilters.test.ts`(4 tests: 최신 우선/디듀프/5건 캡/remove). 두 훅의 localStorage I/O와 CustomEvent fanout이 정상 동작함을 픽스. 합계 9 tests / 4 files 모두 그린. `afterEach` localStorage cleanup으로 테스트 간 격리.
- **Commit**: `pending`
- **Next ideas**: (1) usePageMeta 단위 테스트. (2) BrowseEmptyState `buildActiveFilterRows` 헬퍼 테스트.

## 2026-05-28T10:52 (UTC) — Round 58

- **Benchmark**: [Airbnb mobile filter sheet](https://airbnb.com) — 최근 필터를 데스크톱에서만 노출하면 모바일 사용자에게는 그 기능이 없는 거나 마찬가지. 드로어 상단에 한 줄로 같은 chip을 그대로 띄움.
- **Shipped**: FilterDrawer 상단(타이틀과 필터 패널 사이)에 "최근 필터" mono kicker + 저장된 5건 chip 노출. 클릭 시 드로어를 닫고 그 URL로 navigate, X 버튼은 데스크톱 카드와 동일하게 개별 제거. 비어 있으면 섹션 자체가 숨겨져 첫 방문 모바일 UX 유지.
- **Commit**: `pending`
- **Next ideas**: (1) CommandPalette에도 saved filter 그룹. (2) Footer 카운트업이 0에서 다시 시작하지 않도록 cache 후 후속 hover만 트리거.

## 2026-05-28T10:40 (UTC) — Round 57

- **Benchmark**: [GitHub · Vercel View Transitions](https://github.com) — 다크 토글이 hard flip이면 잠깐 눈이 적응해야 한다. View Transitions API가 있는 브라우저는 자동 cross-fade, 없는 곳도 280ms opacity sweep만 있으면 충분히 부드럽다.
- **Shipped**: `paintWithTransition`이 (1) `prefers-reduced-motion: reduce`면 즉시 paint, (2) `document.startViewTransition`이 있으면 그걸로 cross-fade, (3) 없으면 documentElement에 `transition: background-color, color 280ms ease`만 임시로 부여하고 320ms 후 제거. setMode + system 변경 시 모두 새 경로 경유.
- **Commit**: `pending`
- **Next ideas**: (1) CommandPalette에 saved filter 그룹. (2) Browse 사이드바 모바일 드로어에서 saved filter chip 노출.

## 2026-05-28T10:25 (UTC) — Round 56

- **Benchmark**: [Next.js Link prefetch coverage](https://nextjs.org) — 일반 카드만 prefetch하면 hero에서 클릭한 사용자의 첫 인상은 여전히 느리다. 모든 entry 포인트에서 동일한 패턴이 필요.
- **Shipped**: Hero DropRow에 hover/focus prefetch 추가. ListingCard와 같은 60s staleTime, 캐시 있으면 skip. Seed 데이터(API 없을 때 폴백)는 `id.startsWith('seed-')`로 가드해서 404 prefetch 방지.
- **Commit**: `pending`
- **Next ideas**: (1) CommandPalette에 saved filter 그룹. (2) 다크모드 토글에 transition 모션.

## 2026-05-28T10:10 (UTC) — Round 55

- **Benchmark**: [Raycast favorites at the top](https://raycast.com) — 자주 쓰는 항목은 검색 전에 노출돼야 한다. 명령 팔레트 첫 화면에 위시리스트 미니 뷰가 있으면 "다시 보고 싶은 것"으로 한 번에 점프.
- **Shipped**: CommandPalette에 "위시리스트" 그룹 추가. 검색어 비어 있을 때만 노출, 최대 5건. `useQueries`로 각 slug의 상세 응답을 10분 staleTime으로 하이드레이트, 코랄 fill 하트 아이콘 + 한 줄 메타. 키보드 네비 인덱스(actions → wishlist → listings)와 Enter 라우팅 모두 새 섹션 인지.
- **Commit**: `pending`
- **Next ideas**: (1) Saved filters를 CommandPalette에도 노출. (2) Hero 드롭 마키 사용자가 호버 시 슬러그 prefetch.

## 2026-05-28T09:55 (UTC) — Round 54

- **Benchmark**: [Notion · Linear saved view chips](https://notion.so) — 필터를 다시 조합하려면 손이 여러 번 가는데, "최근에 본 조합 다섯 개"만 있어도 흐름이 끊기지 않는다.
- **Shipped**: `useSavedFilters` 훅 (localStorage 5건 캡) + BrowsePage 상단의 "최근 필터" chip 라인. 활성 필터 ≥2 자동 저장(URL 그대로), 칩 클릭 시 그 URL로 재방문, X 버튼으로 개별 제거. `describeFilters` 헬퍼가 카테고리/타입/기법/난이도/가격 조합을 한 줄 라벨로 합성.
- **Commit**: `pending`
- **Next ideas**: (1) 비교 모달 (위시리스트 2-3개 선택 → 옆에 펼침). (2) 명령 팔레트에 "내 위시리스트" 그룹 추가.

## 2026-05-28T09:38 (UTC) — Round 52

- **Benchmark**: [Anthropic / Vercel / Linear PR gating](https://github.com/vercel/next.js) — 자동 코드 리뷰가 PR 게이트로 강제될 때만 의미가 있다. config 파일만 두면 무시되고, branch protection에서 contexts로 require해야 강제력이 생긴다.
- **Shipped**: `.coderabbit.yaml` 추가 — 한국어 리뷰, auto-review 켜짐, lock/dist/migrations 경로 무시, web/api/shared 경로별 가이드(라임 토큰 검사, zod 스키마 단일 진실 공급원, PrismaService 경유 강제). GitHub branch protection을 main에 적용 — `quality` (CI 워크플로) + `CodeRabbit` 두 status check를 required로, force-push와 delete 금지. enforce_admins=false로 두어 admin 직접 push는 유지.
- **Commit**: `pending`
- **Next ideas**: (1) auto-merge 워크플로에 CodeRabbit 통과 의존. (2) PR template 추가해 리뷰 컨텍스트를 자동으로 채움.

## 2026-05-28T09:25 (UTC) — Round 51

- **Benchmark**: [Pinterest · Reddit · Amazon back-nav](https://pinterest.com) — 카탈로그 깊이 스크롤 → 카드 클릭 → 뒤로 갔을 때 다시 맨 위로 가는 것만큼 답답한 게 없다. 페이지별 sessionStorage 키로 스크롤 위치 복원이 표준.
- **Shipped**: `useScrollRestore` 훅 — 경로+쿼리 단위로 sessionStorage 키 생성, location key 변경 시 한 번만 restore. rAF로 스로틀해 성능 영향 없음. BrowsePage에 마운트해 카탈로그 → 상세 → 뒤로 갈 때 정확히 같은 위치로 돌아옴. /browse?category=Coding 과 /browse?category=Design은 서로 다른 위치 유지.
- **Commit**: `pending`
- **Next ideas**: (1) Sell publish 후 토스트에 미리보기 카드 미니. (2) DashboardPage 라이브러리 탭에도 wishlist처럼 cards-fluid.

## 2026-05-28T09:10 (UTC) — Round 50

- **Benchmark**: [Are.na · BBC time-aware homepage](https://bbc.com) — 시간대에 맞춰 카피가 살짝 변하면 "내 시간을 알고 있다"는 인상이 생긴다. 큰 변화 아니지만 brand presence가 단단해진다.
- **Shipped**: Hero의 RotatingPhrase 입력을 시간 기반 함수(`timeOfDayPhrases`)로 교체. 아침(5–11): "아침엔 새 드롭부터", 낮(11–17): "지금 트렌딩", 저녁(17–22): "오늘의 픽", 밤(22–5): "조용한 시간 컬렉션". 마지막 슬롯엔 항상 "실전 검증" 또는 비슷한 브랜드 앵커를 둬서 일관성 유지.
- **Commit**: `pending`
- **Next ideas**: (1) Recently viewed에 thumbnail-only super-compact 모드. (2) /sell publish 후 새 리스팅 미리보기로 자동 이동.

## 2026-05-28T09:00 (UTC) — Round 49

- **Benchmark**: [Etsy seller onboarding · Gumroad publish form](https://etsy.com) — 발행 폼에 "지금 잘 팔리는 카테고리"가 보이면 셀러가 빈 추측 대신 데이터로 결정한다. 단, 강요하지 않고 보조 칩으로 두는 게 핵심.
- **Shipped**: `TrendingCategoryHint` 컴포넌트 추가. `/listings?sort=trending&pageSize=24`에서 카테고리 빈도를 세서 top 4를 라임 mono kicker + 칩으로 노출. 클릭 시 폼의 카테고리 셀렉트가 그 값으로 동기화. 활성 칩은 잉크 fill로 강조. 데이터 없으면 자동 숨김.
- **Commit**: `pending`
- **Next ideas**: (1) FooterLiveStats 호버 시 카운트업 리플레이. (2) Hero CTA 로컬 시간대에 따라 다른 메시지(아침/저녁).

## 2026-05-28T08:50 (UTC) — Round 48

- **Benchmark**: [Spotify · Apple Music empty libraries](https://music.apple.com) — "비어 있어요" 만 두면 사용자가 어디로 가야 할지 알 수 없다. 무료 추천으로 첫 한 줄을 채워주면 그 자리에서 첫 행동을 끌어낼 수 있다.
- **Shipped**: Dashboard 라이브러리 빈 상태가 EmptyState + 자동 무료 추천(top 4) cards-fluid 그리드로 확장. `useListings({ free: 'true', sort: 'top', pageSize: 4 })`로 페치, 라임 kicker "이걸로 시작해 보세요 · 무료". 카탈로그 둘러보기 CTA는 그대로.
- **Commit**: `pending`
- **Next ideas**: (1) FooterLiveStats 호버 시 카운트업 재실행. (2) Sell 폼에 "최근 트렌딩 카테고리" 자동 제안.

## 2026-05-28T08:38 (UTC) — Round 47

- **Benchmark**: [Vercel · Linear PWA manifest](https://vercel.com) — "Add to Home Screen"이 가능하면 모바일 사용자에게 앱처럼 보인다. 브랜드 컬러와 아이콘이 OS 레벨에서 적용돼야 첫 인상이 깔끔하다.
- **Shipped**: `apps/web/public/manifest.webmanifest` + `icon.svg`(lime "P" sigil on cosmic-ink). `index.html`에 manifest 링크, apple-touch-icon, prefers-color-scheme별 theme-color 두 개(라이트=크림, 다크=잉크), apple-mobile-web-app-* 메타 3종, viewport-fit=cover. 매니페스트에 둘러보기/판매 shortcuts 2개.
- **Commit**: `pending`
- **Next ideas**: (1) Library 빈 상태에서 무료 추천 자동 보여주기. (2) Footer 라이브 통계 호버 시 카운트업 재실행.

## 2026-05-28T08:25 (UTC) — Round 46

- **Benchmark**: [Apple HIG · GOV.UK Design](https://designsystem.digital.gov) — 좋은 디자인 시스템은 사용자가 OS 레벨에서 요청하는 접근성 신호(reduced-motion, contrast more)에 자동으로 응답한다. 우리 시스템은 reduced-motion만 다루고 있어서 contrast more가 빠짐.
- **Shipped**: (1) `prefers-contrast: more` 미디어 쿼리에서 border tokens(`--color-line`, `--color-night-line`)를 더 진한 명도로, focus-volt outline을 3px + 4px offset으로 끌어올림. (2) StarRating의 `aria-label`을 영어 "stars"에서 한국어 "{n}점"으로 변경 — 한국어 스크린리더 사용자에게 자연스럽게 들림.
- **Commit**: `pending`
- **Next ideas**: (1) PWA manifest + iOS startup image. (2) 시드 라이브러리 (Library) 빈 상태에서 무료 추천 자동.

## 2026-05-28T08:15 (UTC) — Round 45

- **Benchmark**: [Airbnb · Notion 사이드바](https://airbnb.com) — sticky 사이드바가 본문보다 살짝 떠 있다는 시각 신호(섀도)가 있어야 페이지 스크롤 시 분리감이 산다. 또한 사이드바 자체가 화면보다 길면 자체 스크롤이 필요하다.
- **Shipped**: Browse 사이드바를 `max-h-[calc(100vh-7rem)] overflow-y-auto`로 만들어 사이드바 자체에 스크롤이 생기고, `backdrop-blur-sm` + 잉크 그림자로 살짝 띄움. `scrollbar-hide` 적용으로 노이즈 없음.
- **Commit**: `pending`
- **Next ideas**: (1) StatsStrip 모바일 가로 스크롤 스냅. (2) Hero 드롭 마키 사용자 호버 시 일시 정지 + 더 자세히 보기 인터랙션.

## 2026-05-28T08:05 (UTC) — Round 44

- **Benchmark**: [Linear `c` = create issue 키바인딩](https://linear.app) — 핵심 액션 하나에는 한 글자 단축키가 있어야 power-user 흐름이 빨라진다. 다른 페이지에서도 부담 없이 같은 키로 진입할 수 있음.
- **Shipped**: `useNavShortcuts`에 단일 `c` 단축키 추가 — 인증 상태일 때만 동작, `/sell`로 이동. 입력 필드 위에선 발동 안 함. ShortcutsOverlay에 "작업" 그룹 추가. token 의존성을 zustand store에서 가져와 로그인/로그아웃 시 정확히 토글.
- **Commit**: `pending`
- **Next ideas**: (1) FilterPanel sticky 스크롤 그림자. (2) StatsStrip 모바일에서 horizontal scroll snap으로 전환.

## 2026-05-28T07:55 (UTC) — Round 43

- **Benchmark**: [Stripe footer · Vercel "live numbers"](https://stripe.com) — 모든 페이지가 공유하는 푸터에 살아있는 숫자가 있으면 "이 사이트 운영되고 있다" 신호가 끊기지 않는다. Hero StatsStrip은 홈에만 있고 다른 페이지엔 그 신호가 없었다.
- **Shipped**: SiteFooter 상단에 `FooterLiveStats` 추가. /listings/stats를 useStats로 끌어와 useCountUp으로 0 → target 카운트업, 라임/바이올렛/코랄 닷 + mono 숫자. 사이트 어디서든 푸터 스크롤만 해도 카탈로그 규모가 즉시 보임. dark/light 일관.
- **Commit**: `pending`
- **Next ideas**: (1) FilterPanel sticky 스크롤 시 그림자 강화. (2) 키보드 단축키 chord(`g s` 외에 `c` = create listing 등 확장).

## 2026-05-28T07:45 (UTC) — Round 42

- **Benchmark**: [Next.js Link prefetch · GitHub repo cards](https://nextjs.org) — 호버는 곧 "클릭하려는 의도"의 가장 흔한 시그널. 그 순간에 다음 페이지 쿼리를 미리 끌어오면 클릭 후 인지 지연이 사실상 0이 된다.
- **Shipped**: `ListingCard`에 hover/focus 시 `queryClient.prefetchQuery`를 두 번 호출 — (1) `listingKey(slug)`로 상세 응답, (2) `relatedKey(id)`로 관련 리스팅. 캐시에 이미 데이터가 있으면 skip(`qc.getQueryData`). 60s / 5min staleTime으로 단기 캐시. 상세 페이지 진입 시 hero/사이드바/관련 탭이 동시에 즉시 렌더.
- **Commit**: `pending`
- **Next ideas**: (1) FilterPanel 스크롤 시 그림자 강화. (2) Footer 라이브 통계 카운트업.

## 2026-05-28T07:32 (UTC) — Round 41

- **Benchmark**: [Pinterest 그리드 perf](https://pinterest.com) — 카드 그리드가 수십 개로 늘어나면 hover 시 3D 틸트가 모든 카드에 계속 계산된다. `content-visibility: auto`는 뷰포트 밖 카드를 layout/paint에서 빼주는 1-line 윈인.
- **Shipped**: `index.css`에 `.card-perf` 유틸 추가 — `content-visibility: auto` + `contain-intrinsic-size: 1px var(--card-skeleton-h)`. ListingCard의 tilt-host 래퍼에 적용. 다이렉트 측정값은 없지만, 50+ 카드 페이지에서 paint cost가 visible viewport에 비례하게 줄어든다.
- **Commit**: `pending`
- **Next ideas**: (1) FilterPanel sticky 스크롤 시 그림자/배경 강화. (2) RelatedListings 호버 시 prefetch.

## 2026-05-28T07:20 (UTC) — Round 40

- **Benchmark**: [GitBook · Substack 긴 글 TOC](https://gitbook.com) — reader mode에서 본문이 길면 ToC가 위치감을 잡아준다. 짧은 본문에서는 노출 자체가 노이즈가 되니 ≥2 entries에서만 보여야 한다.
- **Shipped**: `apps/web/src/components/MarkdownToc.tsx` — H2/H3 ATX 헤딩만 정규식으로 추출(코드펜스 스킵), 한글 슬러그 안전. IntersectionObserver로 현재 보이는 섹션을 추적해 라임 닷 + bold 액티브 표시. 본문 헤딩에 자동 id를 부착해 anchor jump가 동작. ListingDetail의 reading mode에서만(`readingMode && canViewBody`) 본문 위에 인라인 카드로 표시.
- **Commit**: `pending`
- **Next ideas**: (1) Image lazy-load + 카드 skeleton 통합. (2) `/api/sitemap.xml` SSR 메타 등 SEO 추가 폴리시.

## 2026-05-28T07:05 (UTC) — Round 39

- **Benchmark**: [Linear · Vercel toast](https://linear.app) — 토스트가 OS 알림처럼 보이면 디자인 시스템 밖이라는 느낌이 든다. 카드 보더/그림자/폰트가 본문 시스템과 일치해야 한다.
- **Shipped**: `AppProviders`의 `Toaster` 기본 토스트 옵션을 OKLCH 시스템으로 정렬. Hanken Grotesk + Pretendard 폰트 패밀리, 14px 라운드, 깊이감 있는 ink-tinted 그림자, 라임 success / 코랄 error / 라임 loading 아이콘 테마. 다크모드에서는 night-sub 배경 + bone 텍스트로 자동 전환(CSS 변수가 이미 dark에서 스위칭).
- **Commit**: `pending`
- **Next ideas**: (1) MarkdownView TOC 사이드바. (2) Image lazy-load + skeleton 통합.

## 2026-05-28T06:55 (UTC) — Round 38

- **Benchmark**: [Substack feature writer · Are.na profile of the day](https://substack.com) — 한 명만 영구 노출하면 정적인 인상이 남는다. 시간대 기반 회전을 두면 같은 세션에서는 stable하지만 하루 안에서 자연스럽게 변한다.
- **Shipped**: MakerSpotlight를 시간 기반 회전으로. 추천 리스팅에서 distinct author 목록을 뽑아 3시간 윈도우 단위 인덱스로 선택. 같은 메이커의 드롭만 우측 3개 슬롯에 채워서 "이 사람의 작업"이 한 화면에 모이게 함. 빈 데이터 폴백은 그대로.
- **Commit**: `pending`
- **Next ideas**: (1) MarkdownView TOC 사이드바 (긴 본문). (2) Toast 디자인 시스템 정렬.

## 2026-05-28T06:45 (UTC) — Round 37

- **Benchmark**: [Pinterest 상세 페이지 저장 버튼](https://pinterest.com) — 카드 hover로만 위시리스트에 담을 수 있으면 모바일/접근성 사용자가 누락된다. 상세 페이지 사이드바에 명시 액션이 있어야 한다.
- **Shipped**: ListingDetail 사이드바 구매 CTA 아래에 `WishlistButton variant="inline"` 풀 형태로 추가. 비활성 시 잉크 보더 + "위시리스트", 활성 시 코랄 필 + "저장됨". `useWishlist` 훅이 dashboard와 동기화돼서 즉시 반영. 카드 호버 노출 + 사이드바 명시 액션 두 진입점이 같은 store를 가리킴.
- **Commit**: `pending`
- **Next ideas**: (1) MarkdownView TOC 사이드바(긴 본문 reading mode). (2) Featured Maker 회전.

## 2026-05-28T06:35 (UTC) — Round 36

- **Benchmark**: [Notion · Are.na 위시리스트 탭](https://notion.so) — 카드에 하트만 두면 "어디서 다시 보지?"라는 의문이 남는다. 대시보드에 별도 탭이 있어야 의도가 완결된다.
- **Shipped**: `/dashboard`에 "위시리스트" 탭 신설. `useWishlist`로 localStorage slug를 읽고 `useQueries`로 각 slug의 상세 데이터를 10분 staleTime으로 하이드레이트, cards-fluid 그리드로 렌더. 빈 상태에는 ♡ 사용법 안내 + 카탈로그 CTA, 상단에는 mono caps 카운터(코랄 하트) + "전부 지우기" 액션.
- **Commit**: `pending`
- **Next ideas**: (1) ListingDetail 사이드바에 inline wishlist 풀(저장됨/위시리스트). (2) Featured Maker 회차 회전 (top-5 셔플).

## 2026-05-28T05:55 (UTC) — Round 29

- **Benchmark**: [Pinterest · Are.na save](https://pinterest.com) — 즐겨찾기는 hover로 살짝 나타나야 자연스럽다. 항상 보이면 카드가 산만해지고, 누른 상태(저장됨)는 다시 강조되어야 한다.
- **Shipped**: `useWishlist` localStorage 훅 + `WishlistButton` 컴포넌트(카드용 둥근 하트 / 인라인 풀 2가지 변형). 200개 slug 캡, CustomEvent로 같은 탭 내 다중 구독 동기화. ListingCard 표지 우하단에 호버 시만 노출되는 하트 칩을 화살표 인디케이터와 한 줄로 묶음. 활성 시 코랄 fill로 강조.
- **Commit**: [`6899b61`](https://github.com/blue45f/promptmarket/commit/6899b61)
- **Next ideas**: (1) Dashboard에 "위시리스트" 탭 신설. (2) ListingDetail 사이드바에 인라인 wishlist 풀.

## 2026-05-27T23:05 (UTC) — Round 27

- **Benchmark**: [Medium · Reader Mode · Arc Boosts](https://medium.com) — 긴 본문은 사이드바가 가까이 있으면 읽는 흐름을 뺏긴다. 사이트가 직접 제공하는 reader mode가 OS reader mode보다 더 의도된 결과를 만든다.
- **Shipped**: ListingDetail 사이드바 가격 라벨 옆 BookOpen 아이콘 → "조용한 모드" 토글. 켜면 컨테이너 max-width를 820px로 클램프, 사이드바 숨김, 상단에 "사이드바 다시 열기" 풀 버튼(Esc 단축키 표기). 상태는 localStorage(`pm.readingMode`)에 저장돼 다음 방문에서도 유지. 전환 모션 0.5s ease로 부드럽게.
- **Commit**: [`8aa176d`](https://github.com/blue45f/promptmarket/commit/8aa176d)
- **Next ideas**: (1) MarkdownView TOC 사이드바(긴 본문일 때만). (2) 셀러 리스팅 분석 페이지 (개별 슬러그 상세 통계).

## 2026-05-27T22:50 (UTC) — Round 26

- **Benchmark**: [GitHub README · MDN docs · Vercel changelog](https://github.com) — 좋은 마크다운 뷰는 코드 블록마다 호버 시에만 보이는 작은 복사 버튼을 제공한다. 본문 흐름을 가리지 않으면서 필요할 때 정확히 그 한 블록만 가져갈 수 있어야 한다.
- **Shipped**: `MarkdownView`의 `<pre>` 블록을 자체 `CodeBlock` 컴포넌트로 래핑. 우상단 호버 복사 버튼(라임 체크 피드백), `extractText`가 ReactNode 트리를 재귀로 풀어서 정확히 그 블록의 텍스트만 클립보드로 보낸다. `.not-prose`로 prose 트랜스폼 무력화, 라임 액티브 시 opacity 그대로 노출. 한국어 카피(복사/복사됨).
- **Commit**: [`b229165`](https://github.com/blue45f/promptmarket/commit/b229165)
- **Next ideas**: (1) Browse 페이지 SortSelect를 ⌃/⌥ 키로 토글. (2) Featured/Trending 섹션에 미니 콘트라스트 캐러셀(가로 스크롤 vs 그리드 동시 노출).

## 2026-05-27T22:35 (UTC) — Round 25

- **Benchmark**: [Substack · Medium · Are.na 공유 버튼](https://substack.com) — 모바일에서는 OS Share Sheet가, 데스크톱에서는 링크 복사가 자연스럽다. 두 경로 모두 처리하지 않으면 절반 사용자에게 안 보이는 기능이 된다.
- **Shipped**: ListingDetail 사이드바에 Share 버튼 신설. `navigator.share` 가능 시 Web Share API로 OS 시트 호출, 미지원/취소 시 canonical URL을 클립보드로 복사. 공유 상태(공유됨/링크 복사됨/공유)에 따라 라임 체크/Share 아이콘 토글. 가격 라벨을 mono 라임 caps + 디스플레이 스케일 가격으로 다듬어 시각 위계 정리. usePageMeta가 이미 og:url을 세팅해 두어 Share Sheet 미리보기 카드까지 맞물림.
- **Commit**: [`e5a2571`](https://github.com/blue45f/promptmarket/commit/e5a2571)
- **Next ideas**: (1) 코드 블록(`MarkdownView` pre) 우측 상단 인라인 복사 버튼. (2) 리스팅 카드 호버 시 마이크로 미리보기.

## 2026-05-27T22:20 (UTC) — Round 24

- **Benchmark**: [Vercel · Linear 잔여 컴포넌트](https://vercel.com) — 핵심 페이지가 다 정리되어도 자주 안 보이는 상태(에러 페이지, 마크다운, 스켈레톤, 스피너, 타입 배지 오버레이)가 인디고/회색이면 디테일에서 들통난다.
- **Shipped**: 잔여 컴포넌트 토큰 sweep. TypeBadge는 오버레이/기본 두 변형 모두 라임/잉크 토큰으로, MarkdownView는 인디고 링크/zinc 코드블록을 라임/잉크로 + Bricolage display 헤딩, SkeletonDetail은 canvas-deep/night-sub 펄스로, Spinner는 라임 회전 + 인크 라벨로, RouteError는 코랄 키커 + 잉크 글래스 카드 + ink→bone CTA로 한국어화. NavBar는 이미 라임 underline + 잉크 토큰을 갖춰서 변경 없음.
- **Commit**: [`8e93562`](https://github.com/blue45f/promptmarket/commit/8e93562)
- **Next ideas**: (1) 검색 결과 카운트 라인에 정렬·필터 요약 통합. (2) Dashboard 라이브러리 다운로드 버튼 라임 액션 인디케이션.

## 2026-05-27T22:05 (UTC) — Round 23

- **Benchmark**: [Notion property chips · Linear status pills](https://notion.so) — 좋은 메타데이터 칩은 의미 강도가 색의 강도와 일치해야 한다. "쉬움/어려움" 같은 메타가 너무 화려하면 본문보다 시선을 가져간다.
- **Shipped**: DifficultyBadge(입문/중급/고급), TechniqueBadge, LicenseBadge 디자인 시스템 정렬. 난이도는 라임 닷(입문) / 아이리스 닷(중급) / 코랄 닷(고급)으로 카테고리를 즉시 읽히게 하고, 기법은 바이올렛 캡슐, 라이선스는 mono 잉크 캡슐. 모든 칩이 둥근 풀 + 보더 한 줄로 일관, 영문 라벨 한국어화(입문/중급/고급).
- **Commit**: [`b66fde3`](https://github.com/blue45f/promptmarket/commit/b66fde3)
- **Next ideas**: (1) NavBar 데스크톱 메뉴 액티브 라임 인디케이터. (2) RelatedListings 호출처에서 사용하는 헤더("관련" 등) 정리.

## 2026-05-27T21:50 (UTC) — Round 22

- **Benchmark**: [Stripe API · OpenRouter 모델 셀렉터](https://stripe.com) — 모델/벤더 멀티 선택 UI는 두 가지 동작이 동시에 보여야 한다: (1) 지금 선택된 토큰 chip, (2) 벤더별 그룹된 옵션. 그룹 헤더가 무겁지 않게 mono caps로 처리해야 본문 가독성이 살아난다.
- **Shipped**: RelatedListings를 `cards-fluid`로 교체하고 한국어 빈 상태로 정리. ModelPicker 전체 리스킨: 입력은 둥근 풀 + 라임 포커스, 선택된 chip은 잉크 풀로 통일, 그룹 헤더(vendor)는 mono 라임 caps로 가독성 향상, 체크박스 액센트를 `accent-volt-500`로, 패밀리 표시도 mono caps로. 영문 카피("Search models, vendors…", "No models match …") 한국어화.
- **Commit**: [`aff7945`](https://github.com/blue45f/promptmarket/commit/aff7945)
- **Next ideas**: (1) NavBar 데스크톱 메뉴 액티브 라임 인디케이터. (2) Browse 필터 사이드바 + 메타 라인 잔여 영문 카피 sweep.

## 2026-05-27T21:35 (UTC) — Round 21

- **Benchmark**: [Notion · Linear 검색 결과 그리드](https://notion.so) — 결과 카드 그리드를 hard breakpoint 4-column으로 두면 1920+ 와이드에서는 카드가 너무 좁고 1280에서는 4번째 열이 끼어들면서 어색해진다. auto-fit minmax이 정답.
- **Shipped**: BrowsePage 결과 그리드를 `cards-fluid` (auto-fit minmax 280px)로 교체 — 더 이상 sm/lg/xl 단계 고정 컬럼 없음, 컨테이너 폭에 맞춰 자연스럽게 reflow. (SortSelect와 결과 카운터 라벨은 이전 라운드에서 이미 한국어/라임 토큰으로 들어와 있어 이번 라운드는 그리드 reflow와 잔여 디테일 정리만 집중.)
- **Commit**: [`1404585`](https://github.com/blue45f/promptmarket/commit/1404585)
- **Next ideas**: (1) NavBar 데스크톱 메뉴 라임 인디케이터 정렬. (2) RelatedListings(추천) 컴포넌트 토큰 sweep.

## 2026-05-27T21:20 (UTC) — Round 20

- **Benchmark**: [Read.cv · Are.na 작가 카드 + 메타 사이드바](https://read.cv) — 메타 사이드바가 "라벨: 값" 격자라면 카드는 정보가 아니라 표가 된다. 라벨 톤을 mono 라임 caps로 낮추고 값에 시각 무게를 실어줘야 한다.
- **Shipped**: ListingDetail 메타 사이드바 라벨을 한국어로(타입/모델/기법/난이도/카테고리/라이선스/버전/업데이트), `<Meta>` 컴포넌트의 라벨 톤을 mono 라임 caps로 다듬고 카테고리 행 신규 추가. 작가 카드를 ProfilePage 스타일 회전 아바타 + 라임 인디케이터 닷 + 메이커 mono caps로 재구성, 비활성 Follow 버튼을 실제 동작하는 "프로필" 링크로 교체. Overview/Reviews/Related 탭 라벨, 사이드바 구매 CTA, 본문/미리보기 카피, 복사/다운로드 라벨, "리뷰 남기기"/"No reviews yet" 등 잔여 영문 카피 한국어화.
- **Commit**: `pending`
- **Next ideas**: (1) Browse SortSelect 한국어화 + 디자인 토큰 정렬. (2) NavBar 데스크톱 메뉴 액티브 상태 라임 정렬.

## 2026-05-27T21:05 (UTC) — Round 19

- **Benchmark**: [Linear roadmap · Vercel changelog 상세 페이지](https://linear.app) — 상세 페이지는 마켓의 신뢰감을 결정한다. Tabs, 페이월, 구매 CTA, 리뷰 폼 한 곳이라도 라임/잉크 시스템 밖이면 어색하다.
- **Shipped**: ListingDetailPage 토큰 sweep. Tabs 액티브를 인디고→라임으로, 페이월 카드(`🔒 전체 본문 잠금 해제`)를 라임 대시드 + canvas-sub로, 페이지 그라디언트 페이드를 canvas-sub/night-sub로, 사이드바 메인 CTA를 ink→lime slide hover + lift, 리뷰 등록 버튼도 동일, "보유 중" 배지를 라임 인디케이터로, gray-100 잔재를 canvas-deep로. 카피 한국어화(처리 중/구매해서 보기/리뷰 등록/제출 중).
- **Commit**: [`15aff0b`](https://github.com/blue45f/promptmarket/commit/15aff0b)
- **Next ideas**: (1) 상세 페이지 메타 사이드바("Type/Category/Difficulty…") 한국어 라벨화. (2) Author 카드 + Follow 버튼 디자인 정리.

## 2026-05-27T20:50 (UTC) — Round 18

- **Benchmark**: [Airbnb · Booking 필터 시트](https://airbnb.com) — 필터 패널은 마켓플레이스의 두 번째 표지다. 한국어 라벨, 라임 액티브, 부드러운 인풋 인디케이션이 신뢰감을 좌우한다.
- **Shipped**: FilterPanel/FilterDrawer 디자인 패스. 섹션 헤더에 mono kicker + 라임 헤어라인, 타입/카테고리 칩을 인디고에서 라임 토큰으로, 난이도/가격 토글 그룹을 라임 액티브 + 깊이 있는 캔버스 배경으로, 라디오/체크박스 액센트를 `accent-volt-500`으로 통일. 모든 영문 라벨(Filters/Type/Models/Prompt technique/Category/Difficulty/Price)을 한국어로(필터/타입/모델/프롬프트 기법/카테고리/난이도/가격), 난이도·가격 옵션도 입문/중급/고급/전체/무료/유료 한글화. FilterDrawer는 새 인플레이션 글래스 + 잉크→라임 슬라이드 적용 버튼.
- **Commit**: [`3595bb4`](https://github.com/blue45f/promptmarket/commit/3595bb4)
- **Next ideas**: (1) 모델 피커(`ModelPicker`) 잔재 정리. (2) 리스팅 상세 페이지의 메타 사이드바 잔재(Tabs trigger 색상, "Type/Category" 카피) 정리.

## 2026-05-27T20:35 (UTC) — Round 17

- **Benchmark**: [Vercel templates · Linear changelog 카탈로그 헤더](https://vercel.com/templates) — 좋은 카탈로그 페이지는 사용자가 어디 와 있는지 명시한다. mono kicker + 디스플레이 타이틀로 컨텍스트(검색 결과 / 카테고리 / 둘러보기)를 즉시 보여준다.
- **Shipped**: BrowsePage 헤더를 새 디자인 시스템으로 재구성. 라임 kicker, 디스플레이 타이틀이 검색어/카테고리/기본 상태별로 변환. 필터 칩(`Chip`)을 인디고에서 라임으로, SortSelect를 라운드 풀로, 모바일 "필터" 버튼을 풀+카운터 chip로, 결과 카운터를 mono tabular-nums로. 사이드바 패널, 페이지네이션, 액티브 필터 chip strip 모두 새 토큰 정렬.
- **Commit**: [`33a4a1c`](https://github.com/blue45f/promptmarket/commit/33a4a1c)
- **Next ideas**: (1) FilterPanel 내부 인디고 잔재 정리. (2) FilterDrawer 모바일 시트 토큰 정렬.

## 2026-05-27T20:20 (UTC) — Round 16

- **Benchmark**: [Coupang · Amazon 모바일 상세 페이지](https://coupang.com) — 모바일에서는 본문이 길어지면 CTA가 멀어진다. 모든 커머스 앱이 하단에 sticky purchase bar를 둔다.
- **Shipped**: 리스팅 상세 페이지 모바일 전용 sticky CTA. `lg:hidden` + `fixed inset-x-0 bottom-0` + glass 배경 + 라임 슬라이드 호버. 가격을 mono tabular-nums로 강조, 상태별 분기(내 리스팅 / 보유 중 / 구매·받기) 처리. `env(safe-area-inset-bottom)`으로 iOS notch 대응. 본문 끝에 `pb-24`를 줘서 RecentlyViewed가 sticky 바와 겹치지 않게.
- **Commit**: [`8033d79`](https://github.com/blue45f/promptmarket/commit/8033d79)
- **Next ideas**: (1) 모바일 sticky 바를 iOS와 Android 모두에서 화면 회전 시 검증. (2) 카탈로그/홈 페이지에도 "지금 어디 있는지" sticky breadcrumb.

## 2026-05-27T20:05 (UTC) — Round 15

- **Benchmark**: [Reddit · HackerNews 페이지네이션](https://reddit.com) — 인기 카탈로그는 마우스 거리 없이 키보드만으로 페이지를 넘길 수 있게 한다. ←/→는 가장 직관적인 매핑이고 입력 필드 위에서는 발동을 막아야 한다.
- **Shipped**: Browse 페이지네이션 키보드 단축키. 입력/textarea/select/contenteditable 위에서는 안 먹고, ←로 이전 페이지, →로 다음 페이지(엣지에서는 비활성). 페이지네이션 strip을 새 디자인 토큰(Pill, mono 페이지 카운터, 라임 hover)으로 재디자인하고 키 힌트 캡션 추가. ShortcutsOverlay에 "카탈로그 (Browse)" 그룹 신설.
- **Commit**: [`29b2211`](https://github.com/blue45f/promptmarket/commit/29b2211)
- **Next ideas**: (1) 리스팅 상세 페이지에 "j/k로 검색 결과 사이를 이동" (Browse → Detail → Browse 동선). (2) 푸터 줄에 mini 사이트맵.

## 2026-05-27T19:50 (UTC) — Round 14

- **Benchmark**: [GitHub · Stripe sitemap.xml 정책](https://github.com/sitemap.xml) — 대규모 카탈로그는 정적 빌드 산출물 대신 DB에서 동적으로 sitemap을 만든다. robots.txt에서 sitemap URL을 명시해 크롤러가 자동으로 따라오게 한다.
- **Shipped**: 동적 `/api/seo/sitemap.xml` (NestJS `SeoModule`). 정적 7개 경로 + 모든 리스팅 + 모든 사용자 슬러그를 `<urlset>`으로 합성. 본문 `<loc>` 절대 URL은 `SITE_ORIGIN` 환경변수, 미설정 시 `https://promptmarket.dev` 폴백. lastmod = 리스팅 updatedAt. 응답 캐시 15분. 정적 `robots.txt`는 `apps/web/public`에 추가하여 SPA 번들에 그대로 동봉. 프로덕션 nginx는 `/sitemap.xml`을 API의 `/api/seo/sitemap.xml`로 프록시, Vite 개발 서버는 동일 rewrite를 자체 proxy에 추가해 dev/prod 모두 동작.
- **Commit**: [`94a3ee1`](https://github.com/blue45f/promptmarket/commit/94a3ee1)
- **Next ideas**: (1) BrowsePage 페이지네이션을 ?page= 기반 cursor 스타일로 키보드 ←/→ 단축키. (2) Sell 폼에 미리보기 모드 토글 (전체 너비 vs 사이드바).

## 2026-05-27T19:35 (UTC) — Round 13

- **Benchmark**: [Gumroad publish flow · Vercel deploy](https://gumroad.com) — 발행 폼이 유리벽처럼 가벼워 보이면서도 단계가 명확하다. 라이브 미리보기를 sticky 사이드바에 둬서 입력 결과를 즉시 확인.
- **Shipped**: CreateListing 폼 디자인 패스. 입력 표면을 라임 포커스 링 + canvas-sub 카드로 통일, 탭 underline을 인디고→라임, 게시 버튼을 잉크→라임 슬라이드 인 호버, 모든 카피 한국어화(제목/타입/카테고리/본문/태그/모델/기법/난이도/라이선스/버전). Field 라벨/에러 텍스트도 새 토큰. 미리보기 사이드바도 같은 토큰으로 정리. `usePageMeta` 추가.
- **Commit**: [`c0b3a32`](https://github.com/blue45f/promptmarket/commit/c0b3a32)
- **Next ideas**: (1) 푸터에 robots.txt + sitemap.xml 라우트(API). (2) 키보드 단축키 확장(검색 후 j/k 네비, c 새 리스팅).

## 2026-05-27T19:22 (UTC) — Round 12

- **Benchmark**: [Are.na profile · Read.cv](https://are.na) — 메이커 페이지를 단순 "사진 + 이름"이 아니라 카탈로그의 한 챕터처럼 다룬다. 통계 칩(리스팅 수, 무료 포함 여부)이 시각 리듬을 만든다.
- **Shipped**: ProfilePage를 새 디자인 시스템으로 재작성. 라임/잉크 회전 아바타 + 라임 인디케이터 닷, 디스플레이 스케일 사용자명, ambient mesh 히어로, 컬렉션 섹션은 cards-fluid 그리드. `usePageMeta`로 `@username · PromptMarket` 타이틀 + 바이오 디스크립션. 인디고/zinc/rose 잔재 제거.
- **Commit**: [`e57b635`](https://github.com/blue45f/promptmarket/commit/e57b635)
- **Next ideas**: (1) Sell 발행 폼 디자인 패스. (2) CreateListing 미리보기 카드 톤업.

## 2026-05-27T19:10 (UTC) — Round 11

- **Benchmark**: [Gumroad · Stripe Atlas 대시보드](https://gumroad.com) — 셀러 대시보드는 첫 인상이 "여기서 일이 굴러간다"는 인상을 줘야 한다. 통계 카드, 탭, 빈 상태가 모두 같은 시각 언어를 공유.
- **Shipped**: Dashboard 페이지를 새 디자인 시스템으로 재작성. 인디고/zinc 잔재 제거 → OKLCH 라임/잉크/크림. 메이커 이름을 헤드라인 디스플레이로, 탭은 Pill 스타일(active는 잉크 슬라이드), 빈 상태마다 CTA + ⌘아이콘. 지갑은 ambient mesh가 있는 카드로 승격, 충전 칩은 라임 액티브. StatCard에 컬러 액센트 닷.
- **Commit**: [`5f88310`](https://github.com/blue45f/promptmarket/commit/5f88310)
- **Next ideas**: (1) 셀러 페이지(`/users/:username`) 디자인 패스. (2) Sell(`/sell`) 발행 폼 톤업.

## 2026-05-27T18:55 (UTC) — Round 10

- **Benchmark**: [Airbnb · Notion 검색 0건](https://airbnb.com) — "결과 없음"을 단순 알림으로 두지 않고, 어떤 필터가 결과를 막고 있는지 명시한 뒤 한 번에 하나씩 풀 수 있는 인터랙티브 카드를 제공한다.
- **Shipped**: `apps/web/src/components/BrowseEmptyState.tsx` + `buildActiveFilterRows` 유틸. 활성 필터(검색어 · 타입 다중 · 모델 다중 · 기법 · 난이도 · 카테고리 · 가격)를 한국어 라벨로 나열, 각 행 클릭 시 그 필터 하나만 제거하는 deep-link 동작. 전체 카탈로그 / 필터 초기화 CTA, ambient mesh + 그레인 디자인 일관성. Browse가 `q`와 모든 필터를 그대로 전달.
- **Commit**: [`49510a9`](https://github.com/blue45f/promptmarket/commit/49510a9)
- **Next ideas**: (1) 셀러 라이브러리(`/dashboard`) 빈 상태 톤업. (2) 푸터에 sitemap.xml/robots 라우트 안내.

## 2026-05-27T18:45 (UTC) — Round 9

- **Benchmark**: [Linear · Vercel · Stripe 로그인](https://linear.app/login) — 폼 + 브랜드 가치 제안을 좌우로 분할한 스플릿 레이아웃. 가입 직전이 첫인상을 결정하는 페이지인데도 보통 무성의하게 두는 곳을 멋지게 다뤘다.
- **Shipped**: 공용 `AuthLayout` 컴포넌트(좌측 폼 / 우측 ambient mesh + 가치 제안 카드). Login은 데모 계정 3종 빠른 채우기 칩(alice / bob / carol) 포함. Register는 사용자명 → 프로필 URL 힌트 문구. 두 페이지 모두 라임 슬라이드 인 호버 CTA, ⌘K 가이드, OG/Twitter 메타까지 자동 세팅.
- **Commit**: [`2d0f541`](https://github.com/blue45f/promptmarket/commit/2d0f541)
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
