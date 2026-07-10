import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col relative">
        <div className="brand-shimmer" aria-hidden="true" />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
