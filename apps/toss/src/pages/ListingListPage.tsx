import { Top } from '@toss/tds-mobile'
import { useMemo, useState } from 'react'

import { getListings, TYPE_LABEL, price, type Listing } from '../lib/api'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { SearchBar, Chips, Badge } from '../ui'

const ALL = '전체'

function EmojiTile({ emoji, seed, size = 56 }: { emoji: string; seed: string; size?: number }) {
  const hue = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 14,
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.5),
        background: `linear-gradient(140deg, oklch(0.45 0.12 ${hue}), oklch(0.3 0.08 ${hue}))`,
      }}
    >
      {emoji}
    </div>
  )
}

export function ListingListPage() {
  const items = getListings()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(ALL)

  const cats = useMemo(() => {
    const c = new Map<string, number>()
    for (const l of items) c.set(l.category, (c.get(l.category) || 0) + 1)
    return [
      ALL,
      ...[...c.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, 7),
    ]
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((l) => {
      const okC = cat === ALL || l.category === cat
      const okQ =
        !query ||
        [l.title, l.description, l.category, ...(l.tags || []), ...(l.models || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      return okC && okQ
    })
  }, [items, q, cat])

  const open = (l: Listing) => navigate(`/listing/${encodeURIComponent(l.slug || l.id)}`)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>🧩 프롬프트마켓</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            검증된 프롬프트·CLAUDE.md·스킬을 한 곳에서
          </Top.SubtitleParagraph>
        }
      />
      <div style={pageShell}>
        <div className="rise" style={{ marginBottom: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="프롬프트·모델·태그 검색" />
        </div>
        <div className="rise" style={{ animationDelay: '60ms', marginBottom: 18 }}>
          <Chips items={cats} active={cat} onPick={setCat} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => open(l)}
              className="pressable rise"
              style={{
                animationDelay: `${90 + i * 22}ms`,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                padding: 12,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <EmojiTile emoji={l.coverEmoji} seed={l.title} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15.5,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {l.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 7,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <Badge accent>{TYPE_LABEL[l.type] || l.type}</Badge>
                  {l.avgRating ? <Badge>★ {l.avgRating.toFixed(1)}</Badge> : null}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.accent,
                      marginLeft: 'auto',
                    }}
                  >
                    {price(l.priceCents)}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
              ‘{q || cat}’ 결과가 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
