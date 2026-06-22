import { theme } from './theme'

import type { ReactNode } from 'react'

export function Badge({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        color: accent ? theme.accent : theme.textMuted,
        background: accent ? theme.accentSoft : 'rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </span>
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: theme.textMuted,
        }}
      >
        🔍
      </span>
      <input
        className="field"
        value={value}
        placeholder={placeholder || '검색'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="검색"
      />
    </div>
  )
}

export function Chips({
  items,
  active,
  onPick,
}: {
  items: string[]
  active: string
  onPick: (v: string) => void
}) {
  return (
    <div className="chips">
      {items.map((c) => {
        const on = c === active
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className="pressable"
            style={{
              flexShrink: 0,
              height: 34,
              padding: '0 14px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              border: on ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: on ? theme.accent : 'transparent',
              color: on ? theme.accentInk : theme.textMuted,
            }}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

export function Cover({
  gradient,
  src,
  alt,
  height = 150,
  radius = 12,
  seed,
}: {
  gradient?: string[]
  src?: string | null
  alt: string
  height?: number
  radius?: number
  seed?: string
}) {
  const hue = (seed ?? alt).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const grad =
    gradient && gradient.length >= 2
      ? `linear-gradient(140deg, ${gradient[0]}, ${gradient[1]})`
      : `linear-gradient(140deg, oklch(0.5 0.09 ${hue}), oklch(0.3 0.06 ${hue}))`
  const mono = (seed ?? alt).trim().charAt(0).toUpperCase()
  return (
    <div
      style={{
        height,
        borderRadius: radius,
        overflow: 'hidden',
        background: grad,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : mono ? (
        <span
          aria-hidden
          style={{
            fontSize: Math.max(15, Math.round(height * 0.34)),
            fontWeight: 800,
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          {mono}
        </span>
      ) : null}
    </div>
  )
}

export function StatStrip({ stats }: { stats: { label: string; value: string }[] }) {
  if (!stats.length) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '14px 0',
        borderTop: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {stats.map((s) => (
        <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
