import type { Metadata } from "next";
import { PRODUCT_APP_NAME } from "@/src/product/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: PRODUCT_APP_NAME,
  description:
    "Voice-first customer discovery practice for founders who want sharper interviews.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
