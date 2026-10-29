import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendWise AI — Smart Income & Expense Tracker",
  description:
    "SpendWise AI is a clean, animated personal finance dashboard: track income and expenses, monitor available balance, see category-wise spending, and get smart budget alerts.",
  keywords: ["expense tracker", "budget", "personal finance", "income", "spending", "SpendWise"],
  authors: [{ name: "SpendWise AI" }],
  openGraph: {
    title: "SpendWise AI",
    description: "Track smart · Spend wise — income, expenses, budgets and alerts in one clean dashboard.",
    siteName: "SpendWise AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1210" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
