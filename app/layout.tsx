import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Mom Test Simulator",
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
