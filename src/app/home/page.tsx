import { redirect } from 'next/navigation';

// Preserve legacy UUID links; never trust their client-supplied destination (p).
export default async function LegacyHome({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  redirect(s ? `/acesso/${encodeURIComponent(s)}` : '/login');
}
