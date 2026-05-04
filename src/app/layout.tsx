import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Word Search",
  description: "Cari kata dalam file PDF dengan support OCR & multi-bahasa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
