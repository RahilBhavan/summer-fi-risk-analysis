import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summer.fi Risk Analysis | Black Monday Case Study",
  description: "Dynamic Stop-Loss Optimization for DeFi Protocols",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
