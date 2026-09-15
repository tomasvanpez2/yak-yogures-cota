import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartDrawer from "@/components/cart/CartDrawer";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
  openGraph: {
    title: "YAK Yogurt | Fresco · Natural · Artesanal",
    description: "Yogures artesanales, frescos y naturales. Hechos en Cota.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="bg-yak-cream text-yak-ink antialiased font-sans">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
