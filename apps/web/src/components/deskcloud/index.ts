/**
 * DeskCloud — NATIVE integration public entry (PromptMarket / apps/web).
 *
 * Native, env-gated integrations with the live DeskCloud Desks via the published
 * `@heejun/deskcloud` SDK (`pk_` browser clients). All UI is rendered with the
 * app's own components + OKLCH tokens — no widget bundles, no foreign CSS.
 *
 *   • DeskCloudWidgets       — app-shell mount: content-Desk drawer + search palette.
 *   • NavbarNotificationBell — navbar bell: live NotifyDesk inbox ↔ first-party fallback.
 *   • NavbarChangelog        — navbar "What's new": ChangelogDesk (renders only when set).
 */
export { DeskCloudWidgets, default as DeskCloudWidgetsDefault } from './DeskCloudWidgets'
export { default as NavbarNotificationBell } from './NavbarNotificationBell'
export { default as NavbarChangelog } from './NavbarChangelog'
