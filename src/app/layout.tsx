import { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PwaProvider } from "@/features/pwa/provider";

export const metadata: Metadata = {
  title: "Território Digital",
  description: "Administração e área do publicador do Território Digital",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Território Digital", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#44783c" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaProvider><AuthProvider>
          {children}
        </AuthProvider></PwaProvider>
      </body>
    </html>
  );
}
