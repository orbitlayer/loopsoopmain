import type { Metadata } from "next";
import { Inter, Inter_Tight, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default:
      "Loopsoop | Video Editing & Graphic Design | A Creative Division of OrbitLayer",
    template: `%s - ${site.name}`,
  },
  description: site.description,
  keywords: [
    "video editing",
    "graphic design",
    "brand design",
    "post production",
    "cinematic editing",
    "youtube editing",
    "creative studio",
    "Loopsoop",
    "OrbitLayer",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal root: <html>/<body>, fonts, global styles and site-wide metadata.
  // The public chrome (nav/footer) lives in (site)/layout.tsx; the admin app
  // has its own chrome in (admin)/layout.tsx.
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg">{children}</body>
    </html>
  );
}
