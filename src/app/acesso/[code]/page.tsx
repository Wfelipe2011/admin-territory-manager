import { FieldEntry } from '@/features/field/entry';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Área de campo · Território Digital', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <FieldEntry code={code} />;
}
