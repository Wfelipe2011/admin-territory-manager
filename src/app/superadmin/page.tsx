import { Overview } from '@/features/superadmin/overview';
import { parseFilters } from '@/features/superadmin/types';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);
  return <Overview key={JSON.stringify(filters)} initialFilters={filters} />;
}
