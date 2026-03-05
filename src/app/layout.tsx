import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Tier List — 動漫角色排行產生器",
  description: "拖曳排名、寫下觀點、一鍵分享。為動漫和遊戲打造的 Tier List 工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${noto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
