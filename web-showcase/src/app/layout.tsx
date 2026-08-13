import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Finance Risk Study | DeFi Stress Analysis",
  description: "An interactive portfolio case study exploring DeFi market stress, liquidation risk, and decision-support analysis.",
  keywords: ["DeFi risk analysis", "financial data analysis", "market stress simulation", "liquidation risk"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Finance Risk Study | DeFi Stress Analysis",
    description: "An interactive portfolio case study exploring DeFi market stress, liquidation risk, and decision-support analysis.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Finance Risk Study | DeFi Stress Analysis",
    description: "An interactive portfolio case study exploring DeFi market stress, liquidation risk, and decision-support analysis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
