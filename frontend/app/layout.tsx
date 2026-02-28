import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Husker Hustle | UNL Campus Activity Intelligence",
  description:
    "Husker Hustle is an AI-ready campus activity intelligence surface for UNL that blends Mapbox, deck.gl, and timeline analytics to reveal patterns in student behavior and surface proactive insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-red-950 via-zinc-950 to-zinc-950 text-zinc-50`}
      >
        {children}
      </body>
    </html>
  );
}
