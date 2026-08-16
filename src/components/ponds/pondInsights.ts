import type { Biometric, FeedingRecord, PondStatus } from '../../types'

const MS_PER_DAY = 86_400_000

export interface BiometricFeedTimelinePoint {
  biometricId: string
  measuredAt: string
  label: string
  cultivationDay: number
  averageWeightG: number
  growthDeltaG: number | null
  feedWindowKg: number
  cumulativeFeedKg: number
  feedPerDayKg: number
  efficiencyIndex: number | null
}

export const STATUS_META: Record<PondStatus, { label: string; accent: string; surface: string }> = {
  VAZIO: { label: 'Vazio', accent: '#94a3b8', surface: 'rgba(148, 163, 184, 0.14)' },
  PREPARANDO: { label: 'Preparando', accent: '#7dd3fc', surface: 'rgba(125, 211, 252, 0.14)' },
  POVOADO: { label: 'Povoado', accent: '#38bdf8', surface: 'rgba(56, 189, 248, 0.14)' },
  DESPESCANDO: { label: 'Despescando', accent: '#0284c7', surface: 'rgba(2, 132, 199, 0.14)' },
  INATIVO: { label: 'Inativo', accent: '#64748b', surface: 'rgba(100, 116, 139, 0.14)' },
}

// TYPE_LABELS foi removido daqui — havia 5 mapas enum -> label espalhados
// pelo código (dois com texto errado). Fonte única agora é
// `POND_TYPE_LABELS` / `getPondTypeLabel` em `src/lib/pondLabels.ts`.

export function buildBiometricFeedTimeline({
  biometrics,
  feedings,
  stockDate,
}: {
  biometrics: Biometric[]
  feedings: FeedingRecord[]
  stockDate: string
}): BiometricFeedTimelinePoint[] {
  const sortedBiometrics = [...biometrics].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
  const sortedFeedings = [...feedings].sort((a, b) => new Date(a.fedAt).getTime() - new Date(b.fedAt).getTime())
  const stockAt = new Date(stockDate)

  let cumulativeFeedKg = 0

  return sortedBiometrics.map((biometric, index) => {
    const currentAt = new Date(biometric.measuredAt)
    const previous = sortedBiometrics[index - 1]
    const windowStart = previous ? new Date(previous.measuredAt) : stockAt

    const feedWindowKg = sortedFeedings.reduce((sum, feeding) => {
      const fedAt = new Date(feeding.fedAt)
      const isAfterStart = previous ? fedAt > windowStart : fedAt >= windowStart
      return isAfterStart && fedAt <= currentAt ? sum + feeding.feedKg : sum
    }, 0)

    cumulativeFeedKg += feedWindowKg
    const daysInWindow = Math.max(1, Math.round((currentAt.getTime() - windowStart.getTime()) / MS_PER_DAY))
    const growthDeltaRaw = previous ? biometric.averageWeightG - previous.averageWeightG : null
    const growthDeltaG = growthDeltaRaw === null ? null : Number(growthDeltaRaw.toFixed(2))

    return {
      biometricId: biometric.id,
      measuredAt: biometric.measuredAt,
      label: currentAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      cultivationDay: Math.max(0, Math.round((currentAt.getTime() - stockAt.getTime()) / MS_PER_DAY)),
      averageWeightG: Number(biometric.averageWeightG.toFixed(2)),
      growthDeltaG,
      feedWindowKg: Number(feedWindowKg.toFixed(2)),
      cumulativeFeedKg: Number(cumulativeFeedKg.toFixed(2)),
      feedPerDayKg: Number((feedWindowKg / daysInWindow).toFixed(2)),
      efficiencyIndex: growthDeltaG && growthDeltaG > 0 ? Number((feedWindowKg / growthDeltaG).toFixed(2)) : null,
    }
  })
}
