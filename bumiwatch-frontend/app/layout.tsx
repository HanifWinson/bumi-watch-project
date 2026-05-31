import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const dmSans   = DM_Sans(         { subsets: ["latin"], variable: "--font-body",    display: "swap" });

export const metadata: Metadata = {
  title:       "Bumi Watch — Indonesia Environmental Intelligence",
  description: "Ask the Earth. It's Listening. Real-time environmental monitoring for Indonesia powered by Gemini AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-[#0A1812] text-[#D8F3DC] antialiased">{children}</body>
    </html>
  );
}
