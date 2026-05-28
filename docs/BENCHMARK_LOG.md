# PromptMarket Benchmark + Feature Log

지속적으로 누적되는 작업 일지. 가장 최근 회차가 맨 위.

각 회차는 한 가지 영역을 깊게 다루고 main에 직접 푸시한다. 이미 다룬 주제는
다음 회차에서 다시 잡지 않는다.

---

## 2026-05-27T23:05 (UTC) — Round 27

- **Benchmark**: [Medium · Reader Mode · Arc Boosts](https://medium.com) — 긴 본문은 사이드바가 가까이 있으면 읽는 흐름을 뺏긴다. 사이트가 직접 제공하는 reader mode가 OS reader mode보다 더 의도된 결과를 만든다.
- **Shipped**: ListingDetail 사이드바 가격 라벨 옆 BookOpen 아이콘 → "조용한 모드" 토글. 켜면 컨테이너 max-width를 820px로 클램프, 사이드바 숨김, 상단에 "사이드바 다시 열기" 풀 버튼(Esc 단축키 표기). 상태는 localStorage(`pm.readingMode`)에 저장돼 다음 방문에서도 유지. 전환 모션 0.5s ease로 부드럽게.
- **Commit**: `pending`
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
