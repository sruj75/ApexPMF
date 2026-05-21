import type { Metadata } from "next";
import { PRODUCT_APP_NAME, PRODUCT_DESCRIPTION } from "@/src/product/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: PRODUCT_APP_NAME,
  description: PRODUCT_DESCRIPTION,
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
