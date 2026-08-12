import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, EB_Garamond } from "next/font/google";

import { ELLA } from "./contenido";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `Para ${ELLA.nombre}`,
  description: "Un cumplemes, una carta y una ruleta.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1b1210",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${garamond.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
