import type { Metadata } from "next";
import { PublisherScreen } from "@/features/publisher/screen";

export const metadata: Metadata = {
  title: "Área do publicador · Território Digital",
  description: "Interessados e conversas salvos no seu aparelho.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <PublisherScreen />;
}
