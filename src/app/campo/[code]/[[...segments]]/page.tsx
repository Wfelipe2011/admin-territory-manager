import { notFound } from 'next/navigation';
import { FieldScreen } from '@/features/field/screen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Minha designação · Território Digital', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function Page({ params }: { params: Promise<{ code: string; segments?: string[] }> }) {
  const { code, segments = [] } = await params;
  const positive = (value: string) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(+value);
  if (segments.length && !(segments[0] === 'quadra' && positive(segments[1] ?? '') && (segments.length === 2 || (segments.length === 4 && segments[2] === 'rua' && positive(segments[3] ?? ''))))) notFound();
  return <FieldScreen key={[code, ...segments].join(':')} code={code} blockId={segments[1] ? +segments[1] : undefined} addressId={segments[3] ? +segments[3] : undefined} />;
}
