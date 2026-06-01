import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  LineChart,
  Clock,
  RefreshCcw,
  ShieldCheck,
  Settings,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useAdminRevenueSettings,
  useAdminRevenueSettingsHistory,
  useAdminRevenueSummary,
  useUpdateRevenueSettings,
} from '@features/marketplace/queries'
import { getErrorMessage } from '@services/api'
import { usePageMeta } from '@hooks/usePageMeta'
import EmptyState from '@components/EmptyState'
import { formatDollars } from '@utils/format'
import type {
  AdminRevenueSummary,
  RevenueSettings,
  RevenueSettingsHistory,
  TopCreatorRevenue,
} from '@/types'
import { cn } from '@utils/cn'

interface FeePolicy {
  platformFeePercent: number
  premiumFeePercent: number
  premiumThresholdCents: number
  platformFeeFloorCents: number
}

const ZERO_SUMMARY: AdminRevenueSummary = {
  totalPurchases: 0,
  paidPurchases: 0,
  freePurchases: 0,
  totalGrossCents: 0,
  totalSellerNetCents: 0,
  totalPlatformFeeCents: 0,
  topCreators: [],
}

const ZERO_SETTINGS: RevenueSettings = {
  platformFeeBps: 1700,
  premiumFeeBps: 1400,
  platformFeePercent: 17,
  premiumFeePercent: 14,
  premiumThresholdCents: 3000,
  platformFeeFloorCents: 0,
}

const ZERO_POLICY: FeePolicy = {
  platformFeePercent: 17,
  premiumFeePercent: 14,
  premiumThresholdCents: 3000,
  platformFeeFloorCents: 0,
}

interface FeeProjection {
  platformCents: number
  sellerCents: number
  usedFeePercent: number
  tier: 'base' | 'premium'
}

interface ScenarioProjection {
  amount: number
  amountCents: number
  current: FeeProjection
  draft: FeeProjection
  sellerDelta: number
  orderCount: number
  weightPercent: number
  currentSellerCents: number
  draftSellerCents: number
  currentPlatformCents: number
  draftPlatformCents: number
}

const DEFAULT_SCENARIO_ORDER_AMOUNTS = [5, 10, 25, 50, 100]
const DEFAULT_SCENARIO_ORDER_WEIGHTS = [35, 25, 20, 12, 8]

function toFeeProjection(grossCents: number, policy: FeePolicy): FeeProjection {
  const usePremium = grossCents >= policy.premiumThresholdCents
  const usedFeePercent = usePremium ? policy.premiumFeePercent : policy.platformFeePercent
  const rawPlatformCents = Math.max(0, Math.round((grossCents * usedFeePercent) / 100))
  const flooredPlatformCents = Math.max(policy.platformFeeFloorCents, rawPlatformCents)
  const boundedPlatformCents = Math.min(grossCents, flooredPlatformCents)
  return {
    platformCents: boundedPlatformCents,
    sellerCents: Math.max(0, grossCents - boundedPlatformCents),
    usedFeePercent,
    tier: usePremium ? 'premium' : 'base',
  }
}

function formatSignedDelta(delta: number): string {
  const prefix = delta > 0 ? '+' : ''
  return `${prefix}${formatDollars(delta)}`
}

function formatRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

function parsePercentInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(100, Math.max(0, parsed))
}

function parseMoneyInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, parsed)
}

function parseIntegerInput(value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, parsed)
}

function parsePositiveFloatInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, parsed)
}

function formatMoneyInput(cents: number): string {
  const normalized = Math.max(0, Math.round(cents)) / 100
  return normalized.toString()
}

function buildScenarioOrderCounts(totalOrders: number, weights: number[]) {
  const safeTotal = Math.max(0, Math.round(totalOrders))
  if (safeTotal <= 0 || weights.length === 0) return Array(weights.length).fill(0)

  const totalWeight = weights.reduce((sum, value) => sum + Math.max(0, value), 0)
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return Array(weights.length).fill(0)

  const normalizedWeights = weights.map((value) => Math.max(0, value) / totalWeight)
  const raw = normalizedWeights.map((weight) => weight * safeTotal)
  const floor = raw.map((value) => Math.floor(value))
  let remainder = safeTotal - floor.reduce((sum, value) => sum + value, 0)

  const ranked = raw
    .map((value, index) => ({
      index,
      remainder: value - Math.floor(value),
    }))
    .sort((a, b) => b.remainder - a.remainder)

  let idx = 0
  while (remainder > 0 && ranked.length > 0) {
    const target = ranked[idx % ranked.length].index
    floor[target] += 1
    remainder -= 1
    idx += 1
  }

  return floor
}

function historyLabelFromKey(
  key: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (key === 'platform_fee_bps') return t('settings.history.labels.platformFee')
  if (key === 'platform_fee_premium_bps') return t('settings.history.labels.premiumFee')
  if (key === 'platform_fee_premium_threshold_cents')
    return t('settings.history.labels.premiumThreshold')
  return t('settings.history.labels.feeFloor')
}

function historyDisplayValue(key: string, value: number): string {
  if (key === 'platform_fee_bps' || key === 'platform_fee_premium_bps')
    return `${(value / 100).toFixed(2)}%`
  return formatDollars(value)
}

function formatHistoryUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) return ''
  const parsed = new Date(updatedAt)
  if (Number.isNaN(parsed.getTime())) return updatedAt
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export default function AdminPage() {
  const { t } = useTranslation('admin')
  const settingsQ = useAdminRevenueSettings()
  const settingsHistoryQ = useAdminRevenueSettingsHistory()
  const summaryQ = useAdminRevenueSummary(10)
  const updateFeeMutation = useUpdateRevenueSettings()

  const [platformFeePercent, setPlatformFeePercent] = useState(ZERO_POLICY.platformFeePercent)
  const [premiumFeePercent, setPremiumFeePercent] = useState(ZERO_POLICY.premiumFeePercent)
  const [premiumThresholdDollars, setPremiumThresholdDollars] = useState(
    formatMoneyInput(ZERO_POLICY.premiumThresholdCents)
  )
  const [platformFeeFloorDollars, setPlatformFeeFloorDollars] = useState(
    formatMoneyInput(ZERO_POLICY.platformFeeFloorCents)
  )
  const [simulationInput, setSimulationInput] = useState('100')

  usePageMeta({
    title: t('meta.title'),
    description: t('meta.description'),
  })

  useEffect(() => {
    if (!settingsQ.data) return

    setPlatformFeePercent(settingsQ.data.platformFeePercent)
    setPremiumFeePercent(settingsQ.data.premiumFeePercent)
    setPremiumThresholdDollars(formatMoneyInput(settingsQ.data.premiumThresholdCents))
    setPlatformFeeFloorDollars(formatMoneyInput(settingsQ.data.platformFeeFloorCents))
  }, [
    settingsQ.data?.platformFeePercent,
    settingsQ.data?.premiumFeePercent,
    settingsQ.data?.premiumThresholdCents,
    settingsQ.data?.platformFeeFloorCents,
  ])

  const settings = settingsQ.data ?? ZERO_SETTINGS
  const summary = summaryQ.data ?? ZERO_SUMMARY

  const isLoading = settingsQ.isPending || settingsHistoryQ.isPending || summaryQ.isPending
  const error = settingsQ.error ?? settingsHistoryQ.error ?? summaryQ.error

  const settingsHistory: RevenueSettingsHistory = settingsHistoryQ.data ?? []

  const grossDollars = parseMoneyInput(simulationInput)
  const grossCents = Math.round(grossDollars * 100)

  const paidRate = useMemo(() => {
    if (summary.totalPurchases <= 0) return 0
    return Math.round((summary.paidPurchases / summary.totalPurchases) * 100)
  }, [summary.totalPurchases, summary.paidPurchases])

  const currentPolicy: FeePolicy = useMemo(
    () => ({
      platformFeePercent: settings.platformFeePercent,
      premiumFeePercent: settings.premiumFeePercent,
      premiumThresholdCents: settings.premiumThresholdCents,
      platformFeeFloorCents: settings.platformFeeFloorCents,
    }),
    [
      settings.platformFeePercent,
      settings.premiumFeePercent,
      settings.premiumThresholdCents,
      settings.platformFeeFloorCents,
    ]
  )

  const draftPolicy: FeePolicy = useMemo(
    () => ({
      platformFeePercent,
      premiumFeePercent,
      premiumThresholdCents: Math.round(parseMoneyInput(premiumThresholdDollars) * 100),
      platformFeeFloorCents: Math.round(parseMoneyInput(platformFeeFloorDollars) * 100),
    }),
    [platformFeePercent, premiumFeePercent, premiumThresholdDollars, platformFeeFloorDollars]
  )

  const projectionCurrent = useMemo(
    () => toFeeProjection(grossCents, currentPolicy),
    [grossCents, currentPolicy]
  )
  const projectionDraft = useMemo(
    () => toFeeProjection(grossCents, draftPolicy),
    [grossCents, draftPolicy]
  )
  const [monthlyOrderInput, setMonthlyOrderInput] = useState('1000')
  const [monthlyPaidRatioInput, setMonthlyPaidRatioInput] = useState('')
  const [hasMonthlyPaidRatioTouched, setHasMonthlyPaidRatioTouched] = useState(false)
  const [scenarioOrderAmounts, setScenarioOrderAmounts] = useState(
    DEFAULT_SCENARIO_ORDER_AMOUNTS.map((amount) => String(amount))
  )
  const [scenarioOrderWeights, setScenarioOrderWeights] = useState(
    DEFAULT_SCENARIO_ORDER_WEIGHTS.map((weight) => String(weight))
  )
  const monthlyOrderCount = parseIntegerInput(monthlyOrderInput)
  const monthlyPaidRatio = parsePercentInput(monthlyPaidRatioInput)
  const monthlyPaidOrderCount = Math.max(
    0,
    Math.round((monthlyOrderCount * monthlyPaidRatio) / 100)
  )
  const scenarioOrderAmountsParsed = scenarioOrderAmounts.map(parseIntegerInput)
  const scenarioOrderWeightsParsed = scenarioOrderWeights.map(parsePositiveFloatInput)

  const scenarioRows = useMemo(() => {
    return scenarioOrderAmountsParsed.map((amount) => {
      const amountCents = Math.round(amount * 100)
      const current = toFeeProjection(amountCents, currentPolicy)
      const draft = toFeeProjection(amountCents, draftPolicy)
      return {
        amount,
        amountCents,
        current,
        draft,
        sellerDelta: draft.sellerCents - current.sellerCents,
      }
    })
  }, [currentPolicy, draftPolicy, scenarioOrderAmountsParsed])

  const scenarioRowsProjected = useMemo(() => {
    const normalizedWeights = scenarioOrderWeightsParsed.map((value) => Math.max(0, value))
    const orderCounts = buildScenarioOrderCounts(monthlyPaidOrderCount, normalizedWeights)
    const totalWeight = normalizedWeights.reduce((sum, value) => sum + Math.max(0, value), 0) || 1

    const rows: ScenarioProjection[] = scenarioRows.map((row, index) => {
      const orderCount = orderCounts[index] ?? 0
      const weightPercent =
        totalWeight > 0 ? Math.round((normalizedWeights[index] / totalWeight) * 1000) / 10 : 0
      const currentSellerCents = orderCount * row.current.sellerCents
      const draftSellerCents = orderCount * row.draft.sellerCents
      const currentPlatformCents = orderCount * row.current.platformCents
      const draftPlatformCents = orderCount * row.draft.platformCents

      return {
        ...row,
        orderCount,
        weightPercent,
        currentSellerCents,
        draftSellerCents,
        currentPlatformCents,
        draftPlatformCents,
      }
    })

    return rows
  }, [monthlyPaidOrderCount, scenarioRows, scenarioOrderWeightsParsed])

  const scenarioProjectionSummary = useMemo(() => {
    return scenarioRowsProjected.reduce(
      (summary, row) => {
        summary.estimatedGrossCents += row.amountCents * row.orderCount
        summary.currentPlatformCents += row.currentPlatformCents
        summary.draftPlatformCents += row.draftPlatformCents
        summary.currentSellerCents += row.currentSellerCents
        summary.draftSellerCents += row.draftSellerCents
        return summary
      },
      {
        estimatedGrossCents: 0,
        currentPlatformCents: 0,
        draftPlatformCents: 0,
        currentSellerCents: 0,
        draftSellerCents: 0,
      }
    )
  }, [scenarioRowsProjected])

  const projectionDelta = projectionDraft.platformCents - projectionCurrent.platformCents
  const sellerDelta = projectionDraft.sellerCents - projectionCurrent.sellerCents
  const projectedSellerDelta =
    scenarioProjectionSummary.draftSellerCents - scenarioProjectionSummary.currentSellerCents
  const projectedPlatformDelta =
    scenarioProjectionSummary.draftPlatformCents - scenarioProjectionSummary.currentPlatformCents

  const hasDraftChanges =
    Math.abs(platformFeePercent - (settings.platformFeePercent || 0)) > Number.EPSILON ||
    Math.abs(premiumFeePercent - (settings.premiumFeePercent || 0)) > Number.EPSILON ||
    Math.abs(draftPolicy.premiumThresholdCents - (settings.premiumThresholdCents || 0)) >
      Number.EPSILON ||
    Math.abs(draftPolicy.platformFeeFloorCents - (settings.platformFeeFloorCents || 0)) >
      Number.EPSILON

  const canSave = hasDraftChanges && !updateFeeMutation.isPending

  function handleSaveFee(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return

    const patch: {
      platformFeeBps?: number
      premiumFeeBps?: number
      premiumThresholdCents?: number
      platformFeeFloorCents?: number
    } = {}

    const nextPlatformFeeBps = Math.round(Math.min(10000, Math.max(0, platformFeePercent * 100)))
    const nextPremiumFeeBps = Math.round(Math.min(10000, Math.max(0, premiumFeePercent * 100)))
    const nextPremiumThresholdCents = Math.max(
      0,
      Math.round(parseMoneyInput(premiumThresholdDollars) * 100)
    )
    const nextPlatformFeeFloorCents = Math.max(
      0,
      Math.round(parseMoneyInput(platformFeeFloorDollars) * 100)
    )

    if (nextPlatformFeeBps !== settings.platformFeeBps) patch.platformFeeBps = nextPlatformFeeBps
    if (nextPremiumFeeBps !== settings.premiumFeeBps) patch.premiumFeeBps = nextPremiumFeeBps
    if (nextPremiumThresholdCents !== settings.premiumThresholdCents)
      patch.premiumThresholdCents = nextPremiumThresholdCents
    if (nextPlatformFeeFloorCents !== settings.platformFeeFloorCents)
      patch.platformFeeFloorCents = nextPlatformFeeFloorCents

    void updateFeeMutation.mutateAsync(patch)
  }

  const premiumThresholdAmount = formatDollars(settings.premiumThresholdCents)
  const platformFeeFloorAmount = formatDollars(settings.platformFeeFloorCents)

  const hasDraftChangesAffectingPayouts = projectionDelta !== 0
  const platformRate =
    summary.totalGrossCents > 0
      ? (summary.totalPlatformFeeCents / summary.totalGrossCents) * 100
      : 0
  const sellerRate =
    summary.totalGrossCents > 0 ? (summary.totalSellerNetCents / summary.totalGrossCents) * 100 : 0
  const avgPaidOrderValue =
    summary.paidPurchases > 0 ? summary.totalGrossCents / summary.paidPurchases : 0
  useEffect(() => {
    if (!hasMonthlyPaidRatioTouched) {
      setMonthlyPaidRatioInput(String(paidRate))
    }
  }, [paidRate, hasMonthlyPaidRatioTouched])

  return (
    <div className="pb-20 mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)] animate-fade-in">
      <header className="space-y-2 mb-8">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-6 h-px bg-volt-500" />
          {t('header.eyebrow')}
        </p>
        <h1
          className="font-display font-bold text-ink dark:text-bone leading-[0.95] tracking-[-0.035em] display-tight"
          style={{ fontSize: 'var(--text-display-md)' }}
        >
          {t('header.title')}
        </h1>
        <p className="text-ink-soft dark:text-bone-soft max-w-[58ch]">{t('header.subtitle')}</p>
      </header>

      {error && (
        <p className="mb-6 text-sm text-coral-deep dark:text-coral font-mono" role="status">
          {getErrorMessage(error)}
        </p>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_1fr] gap-5">
        <article className="xl:col-span-1 space-y-6 rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 lg:p-8">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 font-mono">
              <Settings className="w-3.5 h-3.5" />
              {t('settings.title')}
            </p>
            <h2 className="font-display text-[1.5rem] leading-tight font-semibold text-ink dark:text-bone">
              {t('settings.current', {
                basePercent: settings.platformFeePercent.toFixed(2),
                premiumPercent: settings.premiumFeePercent.toFixed(2),
                threshold: premiumThresholdAmount,
                floor: platformFeeFloorAmount,
              })}
            </h2>
            <p className="text-[0.88rem] text-ink-soft dark:text-bone-soft">
              {t('settings.description')}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSaveFee}>
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                {t('settings.feeLabel')}
              </span>
              <input
                type="range"
                aria-label={t('settings.feeLabel')}
                min={0}
                max={100}
                step={0.01}
                value={platformFeePercent}
                onChange={(event) => setPlatformFeePercent(parsePercentInput(event.target.value))}
                className="w-full accent-volt-600"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                aria-label={t('settings.percentInputLabel')}
                value={platformFeePercent.toFixed(2)}
                onChange={(event) => setPlatformFeePercent(parsePercentInput(event.target.value))}
                className={cn(
                  'mt-3 w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5',
                  'text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt'
                )}
              />
            </label>

            <label className="block">
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                {t('settings.premiumFeeLabel')}
              </span>
              <input
                type="range"
                aria-label={t('settings.premiumFeeLabel')}
                min={0}
                max={100}
                step={0.01}
                value={premiumFeePercent}
                onChange={(event) => setPremiumFeePercent(parsePercentInput(event.target.value))}
                className="w-full accent-volt-600"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                aria-label={t('settings.premiumPercentInputLabel')}
                value={premiumFeePercent.toFixed(2)}
                onChange={(event) => setPremiumFeePercent(parsePercentInput(event.target.value))}
                className={cn(
                  'mt-3 w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5',
                  'text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt'
                )}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                  {t('settings.thresholdLabel')}
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-ink-mute dark:text-bone-mute">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-label={t('settings.thresholdInputLabel')}
                    value={premiumThresholdDollars}
                    onChange={(event) => setPremiumThresholdDollars(event.target.value)}
                    className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5 pl-7 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                  />
                </div>
                <p className="mt-1 text-[0.72rem] text-ink-soft dark:text-bone-soft">
                  {t('settings.thresholdHelp')}
                </p>
              </label>

              <label className="block">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                  {t('settings.floorLabel')}
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-ink-mute dark:text-bone-mute">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-label={t('settings.floorInputLabel')}
                    value={platformFeeFloorDollars}
                    onChange={(event) => setPlatformFeeFloorDollars(event.target.value)}
                    className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5 pl-7 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                  />
                </div>
                <p className="mt-1 text-[0.72rem] text-ink-soft dark:text-bone-soft">
                  {t('settings.floorHelp')}
                </p>
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSave}
              className={cn(
                'group inline-flex items-center gap-2 w-full justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-tight',
                'focus-volt motion-safe:transition ease-expo',
                canSave
                  ? 'bg-ink dark:bg-bone text-bone dark:text-ink'
                  : 'bg-canvas-sub dark:bg-night-sub text-ink-mute dark:text-bone-mute border border-line dark:border-night-line'
              )}
            >
              {updateFeeMutation.isPending ? t('settings.saving') : t('settings.save')}
              <RefreshCcw
                className={cn('w-4 h-4', updateFeeMutation.isPending && 'motion-safe:animate-spin')}
              />
            </button>
          </form>
        </article>

        <article className="xl:col-span-1 rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 lg:p-8">
          <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 font-mono">
            <LineChart className="w-3.5 h-3.5" />
            {t('summary.title')}
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              label={t('summary.metrics.gross')}
              value={formatDollars(summary.totalGrossCents)}
            />
            <StatCard
              label={t('summary.metrics.platform')}
              value={formatDollars(summary.totalPlatformFeeCents)}
            />
            <StatCard
              label={t('summary.metrics.seller')}
              value={formatDollars(summary.totalSellerNetCents)}
              muted
            />
            <StatCard
              label={t('summary.metrics.paidRatio')}
              value={`${paidRate}% (${summary.paidPurchases}/${summary.totalPurchases})`}
              muted
            />
            <StatCard label={t('summary.metrics.platformTake')} value={formatRate(platformRate)} />
            <StatCard label={t('summary.metrics.sellerTake')} value={formatRate(sellerRate)} />
            <StatCard
              label={t('summary.metrics.avgOrder')}
              value={formatDollars(avgPaidOrderValue)}
              muted
            />
          </div>
        </article>

        <article className="xl:col-span-1 rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 lg:p-8">
          <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 font-mono">
            <Clock className="w-3.5 h-3.5" />
            {t('settings.history.title')}
          </p>
          <p className="mt-2 text-[0.88rem] text-ink-soft dark:text-bone-soft">
            {t('settings.history.subtitle')}
          </p>
          <ul className="mt-4 space-y-3">
            {settingsHistory.map((entry) => (
              <li
                key={entry.key}
                className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                    {historyLabelFromKey(entry.key, t)}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-ink dark:text-bone">
                    {historyDisplayValue(entry.key, entry.value)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-soft dark:text-bone-soft">
                  {entry.updatedAt
                    ? `${t('settings.history.updatedAt')} ${formatHistoryUpdatedAt(entry.updatedAt)}`
                    : t('settings.history.unset')}
                </p>
              </li>
            ))}
          </ul>
          {settingsHistory.length === 0 && (
            <p className="mt-4 text-xs text-ink-soft dark:text-bone-soft">
              {t('settings.history.loading')}
            </p>
          )}
        </article>

        <article className="xl:col-span-1 rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 lg:p-8">
          <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            {t('simulation.title')}
          </p>
          <p className="mt-2 text-[0.88rem] text-ink-soft dark:text-bone-soft">
            {t('simulation.subtitle')}
          </p>

          <label className="mt-5 block">
            <span className="sr-only">{t('simulation.sampleAmountLabel')}</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-ink-mute dark:text-bone-mute">
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                aria-label={t('simulation.sampleAmountLabel')}
                value={simulationInput}
                onChange={(event) => setSimulationInput(event.target.value)}
                className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5 pl-7 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
              />
            </div>
          </label>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <ProjectionRow
              title={t('simulation.currentScenario')}
              projection={projectionCurrent}
              policy={currentPolicy}
            />
            <ProjectionRow
              title={t('simulation.nextScenario')}
              projection={projectionDraft}
              policy={draftPolicy}
            />
            <div className="rounded-2xl px-4 py-3 border border-line dark:border-night-line bg-canvas dark:bg-night">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                {t('simulation.scenarioTitle')}
              </p>
              <div className="mt-3 space-y-2">
                {scenarioRows.map((row, index) => (
                  <div
                    key={`scenario-config-${index}`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  >
                    <label className="block">
                      <span className="text-xs font-mono uppercase tracking-[0.15em] text-ink-mute dark:text-bone-mute">
                        {`${t('simulation.scenarioAmount')} #${index + 1}`}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`${t('simulation.scenarioAmount')} #${index + 1}`}
                        value={scenarioOrderAmounts[index] ?? ''}
                        onChange={(event) =>
                          setScenarioOrderAmounts((prev) => {
                            const next = [...prev]
                            next[index] = event.target.value
                            return next
                          })
                        }
                        className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-mono uppercase tracking-[0.15em] text-ink-mute dark:text-bone-mute">
                        {`${t('simulation.scenarioWeight')} #${index + 1}`}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        aria-label={`${t('simulation.scenarioWeight')} #${index + 1}`}
                        value={scenarioOrderWeights[index] ?? ''}
                        onChange={(event) =>
                          setScenarioOrderWeights((prev) => {
                            const next = [...prev]
                            next[index] = event.target.value
                            return next
                          })
                        }
                        className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="text-[0.62rem] uppercase tracking-[0.15em] text-ink-mute dark:text-bone-mute">
                    <tr>
                      <th className="pb-2 text-left">{t('simulation.scenarioAmount')}</th>
                      <th className="pb-2 text-left">{t('simulation.scenarioCurrent')}</th>
                      <th className="pb-2 text-left">{t('simulation.scenarioNext')}</th>
                      <th className="pb-2 text-left">{t('simulation.scenarioSellerDelta')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((row) => (
                      <tr
                        key={row.amount}
                        className="border-t border-line/70 dark:border-night-line/70 text-ink dark:text-bone"
                      >
                        <td className="py-2">{formatDollars(row.amountCents)}</td>
                        <td className="py-2 tabular-nums">{`${formatDollars(
                          row.current.platformCents
                        )} / ${formatDollars(row.current.sellerCents)}`}</td>
                        <td className="py-2 tabular-nums">{`${formatDollars(
                          row.draft.platformCents
                        )} / ${formatDollars(row.draft.sellerCents)}`}</td>
                        <td
                          className={cn(
                            'py-2 font-mono tabular-nums',
                            row.sellerDelta > 0
                              ? 'text-green-900 dark:text-green-300'
                              : row.sellerDelta < 0
                                ? 'text-coral-deep dark:text-coral'
                                : 'text-ink-soft dark:text-bone-soft'
                          )}
                        >
                          {formatSignedDelta(row.sellerDelta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl px-4 py-3 border border-line dark:border-night-line bg-canvas dark:bg-night">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                {t('simulation.forecastTitle')}
              </p>
              <div className="mt-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                      {t('simulation.monthlyOrdersLabel')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      aria-label={t('simulation.monthlyOrdersLabel')}
                      value={monthlyOrderInput}
                      onChange={(event) => setMonthlyOrderInput(event.target.value)}
                      className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-ink-mute dark:text-bone-mute block mb-2">
                      {t('simulation.monthlyPaidRatioLabel')}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      aria-label={t('simulation.monthlyPaidRatioLabel')}
                      value={monthlyPaidRatioInput}
                      onChange={(event) => {
                        setHasMonthlyPaidRatioTouched(true)
                        setMonthlyPaidRatioInput(event.target.value)
                      }}
                      className="w-full rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night px-3 py-2.5 text-sm font-mono tabular-nums text-ink dark:text-bone focus-volt"
                    />
                    <p className="mt-1 text-[0.72rem] text-ink-soft dark:text-bone-soft">
                      {t('simulation.monthlyPaidRatioHelp', {
                        percentage: `${monthlyPaidRatio}%`,
                        paidRate: `${paidRate}%`,
                      })}
                    </p>
                  </label>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                  label={t('simulation.forecastGross')}
                  value={formatDollars(scenarioProjectionSummary.estimatedGrossCents)}
                />
                <StatCard
                  label={t('simulation.forecastPlatform')}
                  value={formatDollars(scenarioProjectionSummary.currentPlatformCents)}
                  muted
                />
                <StatCard
                  label={t('simulation.forecastPlatformDelta')}
                  value={formatSignedDelta(projectedPlatformDelta)}
                  muted
                />
                <StatCard
                  label={t('simulation.forecastSeller')}
                  value={formatDollars(scenarioProjectionSummary.currentSellerCents)}
                  muted
                />
                <StatCard
                  label={t('simulation.forecastDelta')}
                  value={formatSignedDelta(projectedSellerDelta)}
                  muted
                />
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="text-[0.62rem] uppercase tracking-[0.15em] text-ink-mute dark:text-bone-mute">
                    <tr>
                      <th className="pb-2 text-left">{t('simulation.scenarioAmount')}</th>
                      <th className="pb-2 text-left">{t('simulation.forecastShare')}</th>
                      <th className="pb-2 text-left">{t('simulation.forecastCount')}</th>
                      <th className="pb-2 text-left">{t('simulation.forecastSeller')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRowsProjected.map((row) => (
                      <tr
                        key={`forecast-${row.amount}`}
                        className="border-t border-line/70 dark:border-night-line/70 text-ink dark:text-bone"
                      >
                        <td className="py-2">{formatDollars(row.amountCents)}</td>
                        <td className="py-2 tabular-nums">{`${
                          Number.isInteger(row.weightPercent)
                            ? `${row.weightPercent}%`
                            : `${row.weightPercent.toFixed(1)}%`
                        }`}</td>
                        <td className="py-2 tabular-nums">{row.orderCount}</td>
                        <td className="py-2 tabular-nums">
                          {t('simulation.forecastCurrentSellerDiff', {
                            current: formatDollars(row.currentSellerCents),
                            draft: formatDollars(row.draftSellerCents),
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-mono border',
                'border-line dark:border-night-line bg-canvas dark:bg-night-sub/80'
              )}
            >
              <p className="text-ink-soft dark:text-bone-soft">{t('simulation.delta')}</p>
              <p className="mt-2 font-bold text-[1.02rem] leading-none tracking-[-0.02em] text-ink dark:text-bone">
                {formatSignedDelta(projectionDelta)}
              </p>
              <p className="mt-1 text-xs text-ink-soft dark:text-bone-soft">
                {sellerDelta >= 0
                  ? t('simulation.sellerGain', { amount: formatSignedDelta(sellerDelta) })
                  : t('simulation.sellerLoss', { amount: formatSignedDelta(sellerDelta) })}
              </p>
            </div>

            {hasDraftChangesAffectingPayouts ? (
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm border',
                  sellerDelta >= 0
                    ? 'border-green-300/50 bg-green-100/40 text-green-900 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-200'
                    : 'border-coral/40 bg-coral/15 text-coral-deep dark:bg-coral/15 dark:text-coral'
                )}
              >
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                  {sellerDelta >= 0 ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {sellerDelta >= 0
                    ? t('simulation.impactTitlePositive')
                    : t('simulation.impactTitleNegative')}
                </p>
                <p className="mt-1 text-sm leading-snug">
                  {sellerDelta >= 0
                    ? t('simulation.impactGood', { amount: formatSignedDelta(sellerDelta) })
                    : t('simulation.impactBad', { amount: formatSignedDelta(sellerDelta) })}
                </p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="mt-7 rounded-3xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-6 lg:p-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-volt-700 dark:text-volt-300 font-mono">
              <UserRoundCheck className="w-3.5 h-3.5" />
              {t('creators.title')}
            </p>
            <p className="mt-2 text-ink-soft dark:text-bone-soft">{t('creators.subtitle')}</p>
          </div>
        </div>

        {isLoading && summary.topCreators.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-canvas dark:bg-night h-60 motion-safe:animate-pulse" />
        ) : summary.topCreators.length === 0 ? (
          <EmptyState
            title={t('creators.emptyTitle')}
            description={t('creators.emptyDescription')}
            emoji="🧪"
          />
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-line dark:border-night-line">
            <div className="max-h-[28rem] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas dark:bg-night">
                  <tr className="text-left text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                    <th className="px-4 py-3 font-normal">{t('creators.table.rank')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.creator')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.listings')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.sales')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.gross')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.seller')}</th>
                    <th className="px-4 py-3 font-normal">{t('creators.table.platform')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topCreators.map((row, idx) => (
                    <CreatorRow key={row.creatorId} row={row} rank={idx + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night p-4">
      <p className="text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-display text-[1.28rem] tracking-[-0.04em] font-semibold',
          muted ? 'text-ink-soft dark:text-bone-soft' : 'text-ink dark:text-bone'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ProjectionRow({
  title,
  projection,
  policy,
}: {
  title: string
  projection: FeeProjection
  policy: FeePolicy
}) {
  const { t } = useTranslation('admin')
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3 border border-line dark:border-night-line bg-canvas dark:bg-night'
      )}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
        {title}
      </p>
      <p className="mt-1 font-display text-[1rem] font-semibold text-ink dark:text-bone">
        {projection.usedFeePercent.toFixed(2)}%
      </p>
      <p className="mt-1 text-xs text-ink-soft dark:text-bone-soft">
        {projection.tier === 'premium'
          ? t('simulation.premium', {
              threshold: formatDollars(policy.premiumThresholdCents),
            })
          : t('simulation.base')}
      </p>
      <p className="mt-2 text-[0.87rem] text-ink dark:text-bone">
        {`↳ ${formatDollars(projection.platformCents)} / ${formatDollars(projection.sellerCents)}`}
      </p>
      <p className="text-xs text-ink-soft dark:text-bone-soft">
        {`${t('simulation.share.platform')} / ${t('simulation.share.seller')}`}
      </p>
    </div>
  )
}

function CreatorRow({ row, rank }: { row: TopCreatorRevenue; rank: number }) {
  const platformShare = formatDollars(row.platformFeeCents)
  const sellerShare = formatDollars(row.sellerNetCents)
  const gross = formatDollars(row.grossRevenueCents)

  return (
    <tr className="border-t border-line dark:border-night-line text-sm text-ink dark:text-bone">
      <td className="px-4 py-3">{rank}</td>
      <td className="px-4 py-3">
        <Link
          to={`/users/${row.username}`}
          className="inline-flex items-center gap-1.5 text-volt-700 dark:text-volt-300 hover:underline"
        >
          @{row.username}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </td>
      <td className="px-4 py-3 tabular-nums">{row.listingCount}</td>
      <td className="px-4 py-3 tabular-nums">{row.salesCount}</td>
      <td className="px-4 py-3 tabular-nums">{gross}</td>
      <td className="px-4 py-3 tabular-nums">{sellerShare}</td>
      <td className="px-4 py-3 tabular-nums">{platformShare}</td>
    </tr>
  )
}
