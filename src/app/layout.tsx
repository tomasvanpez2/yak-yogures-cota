import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/cart/CartDrawer";
import WhatsAppFloatButton from "@/components/ui/WhatsAppFloatButton";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YAK Yogurt | Fresco · Natural · Artesanal",
  description:
    "Yogur artesanal hecho a mano en Cota. Ingredientes naturales, botellas de vidrio reutilizables. Entregas en Cota, Chía, Cajicá, Calle 80, Suba y Sur.",
  applicationName: "YAK Yogurt",
  authors: [{ name: "YAK Yogurt", url: "https://yakyogurt.co" }],
  keywords: [
    "yogur artesanal",
    "yogur Cota",
    "yogures naturales",
    "vidrio retornable",
    "lotes pequeños",
    "yogur colombia",
    "yogur chía",
    "yogur cajicá",
    "yogur bogotá",
  ],
  category: "food",
  openGraph: {
    title: "YAK Yogurt | Fresco · Natural · Artesanal",
    description: "Yogures artesanales, frescos y naturales. Hechos en Cota.",
    type: "website",
    siteName: "YAK Yogurt",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "YAK Yogurt | Fresco · Natural · Artesanal",
    description: "Yogures artesanales, frescos y naturales. Hechos en Cota.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#1B2A3A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={`${spaceGrotesk.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-yak-cream text-yak-ink antialiased font-sans safer-inset-top safer-inset-left safer-inset-right safer-inset-bottom">
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        <CartProvider>
          <main id="main" data-focus-trap-layer="true">
            {children}
          </main>
          <CartDrawer />
          <WhatsAppFloatButton />
        </CartProvider>
      </body>
    </html>
  );
}
