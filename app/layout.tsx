import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ThemeProviderWrapper from "@/components/ThemeProviderWrapper";
import { Analytics } from '@vercel/analytics/react'; 

// Configure Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arthur Azoulai | Creative Technologist",
  description: "My portfolio.",
  openGraph: {
    title: "Arthur Azoulai | Creative Technologist",
    description: "My portfolio.",
    url: "https://arthurazoulai.com",
    siteName: "Arthur Azoulai",
    images: [
      {
        url: "/og-image.jpg", // Update this path to your actual image
        width: 1200,
        height: 630,
        alt: "Arthur Azoulai Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arthur Azoulai | Creative Technologist",
    description: "My portfolio",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
        <Analytics />
      </body>
    </html>
  );
}