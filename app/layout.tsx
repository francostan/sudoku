import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import {
  Comfortaa,
  Geist_Mono,
  Bree_Serif,
} from "next/font/google";

// Initialize fonts
const _comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const _breeSerif = Bree_Serif({ subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Sudoku Game",
  description: "Elegant Sudoku game with AI-powered solving analysis",
  authors: [{ name: "francostan" }],
  keywords: ["sudoku", "puzzle", "game", "AI analysis", "cognitive training"],
  openGraph: {
    title: "Sudoku Game",
    description: "Elegant Sudoku game with AI-powered solving analysis",
    images: [
      {
        url: "/preview.jpg",
        width: 1200,
        height: 630,
        alt: "Sudoku Game Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sudoku Game",
    description: "Elegant Sudoku game with AI-powered solving analysis",
    images: ["/preview.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
