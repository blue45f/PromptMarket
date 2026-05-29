# DESIGN.md

The design spec for PromptMarket's web client. Source of truth lives in
`apps/web/src/index.css` (`@theme` tokens); this documents the intent so
changes stay on-brand.

## Voice

**Electric · deliberate · alive.** A catalog for builders shipping production
with frontier models. Editorial confidence on the marketing surfaces (home,
auth panels, footer); quiet, trustworthy density on the product surfaces
(browse, detail, dashboard). Never generic SaaS.

- **Register** — `brand` on the home/landing/auth hero panels (design is the
  product); `product` on browse, listing detail, dashboard, forms (design
  serves the task). Most files are product register.

## Color (OKLCH, never `#000`/`#fff`)

Signature: **chartreuse "volt" lime on cosmic ink, warmed by cream and coral.**
Every neutral is tinted toward the violet–magenta axis so the canvas reads as a
brand surface, not stock white/black.

- **Surfaces (light)** — `canvas` / `canvas-sub` / `canvas-deep` warm cream;
  `ink` / `ink-soft` / `ink-mute` violet-charcoal text; `line` hairlines.
- **Surfaces (dark)** — `night*` magenta-charcoal (not zinc); `bone*` text.
- **Volt** (`volt-50…900`) — the electric accent. Focus rings, active dots,
  free-tier badges, the marker highlight. Used as accent, not as a fill-everything.
- **Chromatic accents** — `violet`, `coral`, `iris`. Purposeful (data, dots,
  gradients), never decoration.
- Strategy: product surfaces are **Restrained** (tinted neutrals + volt accent);
  the home hero and footer go **Committed** (saturated gradient washes).

## Typography

- **Display** — Bricolage Grotesque (variable width + weight). Headlines use the
  `display-tight` / `display-wide` / `display-condense` width-axis helpers.
- **Text** — Hanken Grotesk. **Mono / numerals** — JetBrains Mono.
- **Korean** — Pretendard Variable is the partner family; it picks up Hangul
  glyphs automatically. `word-break: keep-all` keeps Hangul words intact.
- Fluid scale via `clamp()` tokens (`--text-display-xl … --text-body`). Hierarchy
  through scale + weight contrast (≥1.25 steps).

## Motion (overdrive layer)

Ease-out on exponential curves (`cubic-bezier(0.16,1,0.3,1)`); no bounce. All of
it respects `prefers-reduced-motion`.

- `reveal` (scroll-in opacity+translate), `tilt` / `spotlight` / `cursor-sheen`
  on cards, `marquee` tickers, `volt-pulse` live dots, `letter-in` headline
  stagger, count-up stat strips (`useCountUp`), grain texture overlay.

## Components

Reusable primitives in `apps/web/src/components/`: `ListingCard` (tilt + mesh
cover), badges (`TypeBadge`/`ModelBadge`/`DifficultyBadge`/`LicenseBadge`/
`TechniqueBadge`), `StatsStrip`, `EmptyState`, skeletons, `ThemeToggle`,
`LanguageToggle`. Every interactive control carries default/hover/focus/active
states and a `focus-volt` ring.

## Internationalization

Korean is the **default** operating language; English is the secondary locale.

- Stack: `react-i18next` + `i18next-browser-languagedetector`, initialized in
  `apps/web/src/i18n/index.ts`. Detection order: `localStorage('pm_lang')` →
  `htmlTag`, falling back to `ko`. `<html lang>` is kept in sync.
- Namespaces (one file per surface, `locales/{ko,en}/<ns>.json`): `common`,
  `nav`, `home`, `browse`, `detail`, `auth`, `dashboard`, `profile`, `create`,
  `errors`.
- In components: `const { t } = useTranslation('<ns>')`; interpolate with
  `{{var}}`; pluralize with `_one` / `_other` keys.
- Numbers / currency / dates go through `Intl` keyed to the active locale
  (`activeIntlLocale()` in `utils/format.ts`) — `만/억` under ko, `K/M` under en.
- **Do not** translate domain data from `@promptmarket/shared` (type/model/
  license/difficulty labels); those are the single source of truth.
- English runs ~30% longer than Korean — keep fluid/flex sizing, no fixed widths
  on text containers.

## Absolute bans

No side-stripe accent borders, no gradient text, no decorative glassmorphism,
no em dashes in copy, no identical-card-grid filler. Match the register
reference in the impeccable skill before shipping.
