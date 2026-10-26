import type { Page, Route } from '@playwright/test';
import type { Monitoring, Tenant, Usage } from '../../src/features/superadmin/types';

export const api = process.env.FIELD_API_URL || 'http://localhost:3001/v1';
export const instant = new Date('2030-01-01T12:00:00Z');
export const token = (superAdmin = true, tenantId = 1) => `qa.${Buffer.from(JSON.stringify({ userName: 'Super admin QA', tenantName: `Congregação QA ${tenantId}`, tenantId, roles: superAdmin ? ['admin', 'super_admin'] : ['admin'], exp: 1956528000 })).toString('base64url')}.qa`;
export const tenant = (id: number): Tenant => ({ id, name: `Congregação QA ${id}`, city: id % 2 ? 'Sorocaba' : 'Campinas', state: id % 2 ? 'SP' : 'RJ',
  houses: 1200, territories: 20, registeredUsers: 3, openRounds: 1, closedRounds: 1, pendingRequests: id % 3 === 0 ? 4 : 0,
  completedHouses: 100, operationalActivity: id % 2 ? 1 : 0, lastActivity: instant.toISOString(),
  samples: id === 4 ? 0 : 40, average: id === 4 ? null : 2, peak: id === 4 ? null : 5, peakAt: id === 4 ? null : instant.toISOString(), online: id === 1 ? 8 : 0, fieldActivity: id % 2 === 1 });
const emptyMetrics = { requests: 400, errors: 2, clientErrors: 1, aborted: 3, averageMs: 80, p95Ms: 250, errorRate: .5 };
export const monitoring: Monitoring = {
  generatedAt: instant.toISOString(), from: new Date(+instant - 86400000).toISOString(), to: instant.toISOString(), period: '24h',
  services: {
    api: { state: 'operational', observedAt: instant.toISOString(), detail: 'Esta instância da API respondeu' },
    database: { state: 'operational', observedAt: instant.toISOString(), detail: 'Consulta PostgreSQL concluída', latencyMs: 5, active: 2, idle: 5, limit: 100 },
    worker: { state: 'operational', observedAt: instant.toISOString(), detail: 'Worker respondendo', latencyMs: 8, readModelEnabled: true, listenerConnected: true, poolSize: 2, poolTotal: 2, poolIdle: 1, poolWaiting: 0, activeRequests: 12 },
  }, collection: { lastPersistedAt: instant.toISOString(), stale: false, error: '', retentionDays: 7 },
  summary: emptyMetrics, polling: { ...emptyMetrics, requests: 100, averageMs: 24900, p95Ms: 30000 },
  categories: [{ ...emptyMetrics, component: 'api', category: 'write' }, { ...emptyMetrics, component: 'worker', category: 'field_poll', averageMs: 24900 }],
  series: Array.from({ length: 12 }, (_, i) => ({ ...emptyMetrics, at: new Date(+instant - (12 - i) * 900000).toISOString(), kind: 'operation' as const, p95Ms: 150 + i * 10, averageMs: 40 + i * 2 })),
  resources: { scope: 'Ambiente visível ao processo da API', uptimeSeconds: 86400, cpuPercent: 22, memoryPercent: 40, totalMemoryMb: 8192, usedMemoryMb: 3276, apiRssMb: 140, loadAverage: [.4, .3, .2] }, alerts: [],
};
export async function setup(page: Page, count = 18, superAdmin = true) {
  await page.clock.install({ time: instant });
  await page.context().addCookies([{ name: 'token', value: token(superAdmin), url: process.env.FIELD_BASE_URL || 'http://localhost:4800' }]);
  const state = { tenants: Array.from({ length: count }, (_, i) => tenant(i + 1)), monitor: structuredClone(monitoring), usageReads: 0, monitoringReads: 0,
    failUsage: false, failMonitoring: false, failedSave: false, writes: [] as { method: string; path: string; body: Record<string, unknown> }[], delayed: null as Route | null, unexpected: [] as string[] };
  await page.route(`${api}/**`, route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.replace('/v1/', '');
    if (path === 'dashboard/usage') {
      state.usageReads++;
      if (state.failUsage) return route.fulfill({ status: 503, json: { message: 'Uso indisponível QA' } });
      const scope = Number(url.searchParams.get('tenantId')) || null;
      const tenants = scope ? state.tenants.filter(row => row.id === scope) : state.tenants;
      const data: Usage = { scope, from: new Date(+instant - 7 * 86400000).toISOString(), to: instant.toISOString(), generatedAt: instant.toISOString(), lastCollectedAt: instant.toISOString(),
        resolutionSeconds: 3600, groupSeconds: 3600, options: state.tenants, tenants,
        summary: { ...tenant(1), houses: tenants.reduce((sum, row) => sum + row.houses, 0), pendingRequests: tenants.reduce((sum, row) => sum + row.pendingRequests, 0), online: scope ? tenants[0]?.online || 0 : 8, congregations: tenants.length, activeCongregations: tenants.filter(row => row.fieldActivity || row.operationalActivity).length },
        series: Array.from({ length: 36 }, (_, i) => ({ slotAt: new Date(+instant - (36 - i) * 3600000).toISOString(), active: scope ? scope + i % 3 : 8 + i % 8, average: scope ? scope / 2 + i % 2 : 5 + i % 4, peakAt: instant.toISOString(), samples: 120 })),
        cities: [{ city: 'Sorocaba', state: 'SP', congregations: Math.ceil(tenants.length / 2), active: Math.ceil(tenants.length / 2), online: 8 }, { city: 'Campinas', state: 'RJ', congregations: Math.floor(tenants.length / 2), active: 0, online: 0 }],
      };
      if (state.delayed) return;
      return route.fulfill({ json: data });
    }
    if (path === 'dashboard/monitoring') {
      state.monitoringReads++;
      return route.fulfill(state.failMonitoring ? { status: 503, json: { message: 'Monitoramento indisponível QA' } } : { json: { ...state.monitor, period: url.searchParams.get('period') || '24h' } });
    }
    if (/^admin\/tenants\/\d+$/.test(path)) {
      const id = Number(path.split('/').at(-1)), row = state.tenants.find(row => row.id === id)!;
      if (request.method() === 'PATCH') {
        state.writes.push({ method: 'PATCH', path, body: request.postDataJSON() });
        if (state.failedSave) return route.fulfill({ status: 400, json: { message: 'Cadastro inválido QA' } });
        Object.assign(row, request.postDataJSON());
      }
      return route.fulfill({ json: { ...row, phone: '11999999999' } });
    }
    if (path === 'admin/tenants/switch') {
      state.writes.push({ method: 'POST', path, body: request.postDataJSON() });
      return route.fulfill({ json: { token: token(true, Number(request.postDataJSON().tenantId)) } });
    }
    if (path === 'login') return route.fulfill({ json: { token: token(superAdmin) } });
    if (path === 'rounds/info') return route.fulfill({ json: [] });
    if (path === 'dashboard/territory-details') return route.fulfill({ json: { total: 100 } });
    if (path.startsWith('change-requests/sync')) return route.fulfill({ json: { cursor: 'qa', pending: 0 } });
    state.unexpected.push(path);
    return route.fulfill({ status: 404, json: {} });
  });
  return state;
}
