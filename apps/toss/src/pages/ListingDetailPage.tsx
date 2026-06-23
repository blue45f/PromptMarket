import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'

import { getListing, TYPE_LABEL, DIFFICULTY_LABEL, price, type Listing } from '../lib/api'
import { shareMessage } from '../lib/toss'
import { navigate } from '../router'
import { theme } from '../theme'
import { Badge, StatStrip } from '../ui'

export function ListingDetailPage({ id = '' }: { id?: string }) {
  const [l, setL] = useState<Listing | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getListing(id)
      .then((data) => {
        setL(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load listing detail:', err)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!toast) return
    const x = window.setTimeout(() => setToast(null), 2000)
    return () => window.clearTimeout(x)
  }, [toast])

  const Header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 8px',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: `color-mix(in oklab, ${theme.bg} 84%, transparent)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate('/')}
        className="pressable"
        style={{
          width: 44,
          height: 44,
          background: 'none',
          border: 'none',
          color: theme.text,
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        ←
      </button>
    </header>
  )

  if (loading)
    return (
      <div style={{ background: theme.bg, minHeight: '100dvh' }}>
        {Header}
        <p style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 40 }}>
          불러오는 중...
        </p>
      </div>
    )

  if (!l)
    return (
      <div style={{ background: theme.bg, minHeight: '100dvh' }}>
        {Header}
        <p style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 40 }}>
          상품을 찾을 수 없어요.
        </p>
      </div>
    )

  const hue = l.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const share = async () => {
    const r = await shareMessage(`[프롬프트마켓] ${l.title}\n${l.description}`)
    if (r === 'clipboard') setToast('클립보드에 복사했어요.')
  }
  const stats = [
    { label: '가격', value: price(l.priceCents) },
    l.avgRating ? { label: '평점', value: '★ ' + l.avgRating.toFixed(1) } : null,
    typeof l.downloads === 'number'
      ? { label: '다운로드', value: l.downloads.toLocaleString() }
      : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {Header}
      <div className="rise" style={{ padding: '4px 20px 110px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              fontSize: 38,
              flexShrink: 0,
              background: `linear-gradient(140deg, oklch(0.45 0.12 ${hue}), oklch(0.3 0.08 ${hue}))`,
            }}
          >
            {l.coverEmoji}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <Badge accent>{TYPE_LABEL[l.type] || l.type}</Badge>
              <Badge>{l.category}</Badge>
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.32 }}>{l.title}</h1>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <StatStrip stats={stats} />
        </div>

        {l.description && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.78,
              color: theme.text,
              margin: '20px 0 0',
              maxWidth: '72ch',
            }}
          >
            {l.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
          {l.difficulty && <Badge>{DIFFICULTY_LABEL[l.difficulty] || l.difficulty}</Badge>}
          {l.license && <Badge>{l.license}</Badge>}
          {l.technique && <Badge>{l.technique}</Badge>}
          {l.version && <Badge>v{l.version}</Badge>}
        </div>

        {l.models?.length ? (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>대상 모델</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {l.models.map((m) => (
                <Badge key={m} accent>
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {l.tags?.length ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {l.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
          </div>
        ) : null}

        <p style={{ marginTop: 22, fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>
          구매 시 전체 프롬프트 본문과 사용 가이드가 제공돼요. 결제는 토스 심사 후 인앱결제로
          연결됩니다.
        </p>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={share}
            className="pressable"
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            공유하기
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${theme.bg} 72%, transparent)`,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flexShrink: 0, fontSize: 17, fontWeight: 800 }}>{price(l.priceCents)}</div>
        <Button
          style={{ flex: 1 }}
          onClick={() => setToast('구매는 토스 심사 후 인앱결제로 제공돼요.')}
        >
          구매하기
        </Button>
      </div>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 'calc(88px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.86)',
            color: theme.text,
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13.5,
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
