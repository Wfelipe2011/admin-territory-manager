import { Tenants } from '@/features/superadmin/tenants';
import { parseFilters } from '@/features/superadmin/types';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params), condition = typeof params.condition === 'string' && ['pending', 'inactive'].includes(params.condition) ? params.condition : '';
  return <Tenants key={JSON.stringify([filters, condition])} initialFilters={filters} initialCondition={condition} />;
}
