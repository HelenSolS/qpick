import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Сертификаты фотостудии",
  description: "Подарочные сертификаты",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
