import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { InAppBrowserBanner } from "@/components/InAppBrowserBanner";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-comfortaa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Two Fins (Две Ласты)",
  description: "Личный кабинет школы плавания Two Fins (Две Ласты)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`h-full antialiased ${comfortaa.variable}`}>
      <body className="min-h-full flex flex-col relative">
        <div className="brand-shimmer" aria-hidden="true" />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          <InAppBrowserBanner />
          {children}
        </div>
      </body>
    </html>
  );
}
