import type { Metadata } from "next";
import { Noto_Sans_Mono, Noto_Serif_SC, Playfair_Display } from "next/font/google";
import "./globals.css";

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-mono",
  subsets: ["latin", "cyrillic"],
});

// 展示字体：拉丁标题使用 Playfair Display，中文标题使用 Noto Serif SC
const playfairDisplay = Playfair_Display({
  variable: "--font-display-latin",
  subsets: ["latin"],
  weight: ["600"],
});

const notoSerifSc = Noto_Serif_SC({
  variable: "--font-display-cjk",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "Po Agent",
  description: "Local desktop workspace for the Pi coding agent — manage sessions, inspect files, and configure models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${notoSansMono.variable} ${playfairDisplay.variable} ${notoSerifSc.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
