import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DuyT Booking",
  description: "DuyT Booking - hệ thống đặt chỗ và quản trị địa điểm",
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
