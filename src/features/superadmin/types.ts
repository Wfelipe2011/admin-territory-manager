export type TenantOption = { id: number; name: string; city: string; state: string };
export type Tenant = TenantOption & {
  houses: number; territories: number; registeredUsers: number; openRounds: number; closedRounds: number;
  pendingRequests: number; completedHouses: number; operationalActivity: number; lastActivity: string | null;
  samples: number; average: number | null; peak: number | null; peakAt: string | null; online: number; fieldActivity: boolean;
};
export type Usage = {
  scope: number | null; from: string; to: string; generatedAt: string; lastCollectedAt: string | null;
  resolutionSeconds: number; groupSeconds: number; options: TenantOption[]; tenants: Tenant[];
  summary: Pick<Tenant, 'houses' | 'territories' | 'registeredUsers' | 'openRounds' | 'closedRounds' | 'pendingRequests' | 'completedHouses' | 'samples' | 'average' | 'peak' | 'peakAt' | 'online'> & { congregations: number; activeCongregations: number };
  series: { slotAt: string; active: number; average: number; peakAt: string; samples: number }[];
  cities: { city: string; state: string; congregations: number; active: number; online: number }[];
};
export type MetricSummary = { requests: number; errors: number; clientErrors: number; aborted: number; errorRate: number | null; averageMs: number | null; p95Ms: number | null };
export type ServiceObservation = {
  state: 'operational' | 'degraded' | 'unavailable' | 'unknown'; observedAt: string | null; detail: string;
  latencyMs?: number; active?: number; idle?: number; limit?: number; poolSize?: number; poolTotal?: number;
  poolIdle?: number; poolWaiting?: number; listenerConnected?: boolean; readModelEnabled?: boolean; activeRequests?: number;
};
export type Monitoring = {
  generatedAt: string; from: string; to: string; period: string;
  services: { api: ServiceObservation; database: ServiceObservation; worker: ServiceObservation };
  collection: { lastPersistedAt: string | null; stale: boolean; error: string; retentionDays: number };
  summary: MetricSummary; polling: MetricSummary;
  categories: (MetricSummary & { component: string; category: string })[];
  series: (MetricSummary & { at: string; kind: 'operation' | 'poll' })[];
  alerts: { kind: string; severity: 'warning' | 'critical'; message: string }[];
  resources: { scope: string; uptimeSeconds: number; cpuPercent: number | null; memoryPercent: number; totalMemoryMb: number; usedMemoryMb: number; apiRssMb: number; loadAverage: number[] };
};
export type UsageFilters = { period: string; tenantId: string; groupBy: string; from: string; to: string };
export const defaultFilters: UsageFilters = { period: '7d', tenantId: '', groupBy: '1h', from: '', to: '' };
export function parseFilters(params: Record<string, string | string[] | undefined>): UsageFilters {
  const string = (key: string) => typeof params[key] === 'string' ? params[key] as string : '';
  return { period: ['1d', '7d', '30d', 'custom'].includes(string('period')) ? string('period') : '7d',
    groupBy: ['10min', '30min', '1h', '1d'].includes(string('groupBy')) ? string('groupBy') : '1h',
    tenantId: /^\d+$/.test(string('tenantId')) ? string('tenantId') : '', from: string('from'), to: string('to') };
}
export function usageQuery(filters: UsageFilters) {
  const query = new URLSearchParams({ groupBy: filters.groupBy });
  if (filters.tenantId) query.set('tenantId', filters.tenantId);
  if (filters.period === 'custom') {
    const from = new Date(filters.from), to = new Date(filters.to);
    if (!Number.isFinite(+from) || !Number.isFinite(+to) || from >= to || +to - +from > 366 * 86400000) return null;
    query.set('from', from.toISOString()); query.set('to', to.toISOString());
  } else query.set('period', filters.period);
  return query.toString();
}
