import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuyT",
  description: "DuyT Danang-Concierge reservation and admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
