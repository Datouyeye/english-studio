import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Studio · 英语学习",
  description: "把感兴趣的材料改写成适合自己水平的英文文章，并收藏、复习有用的表达。",
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/library", label: "学习库" },
  { href: "/review", label: "卡片复习" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border/70">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-base font-semibold tracking-tight text-primary">
              English Studio
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text-muted transition-colors duration-150 hover:text-text"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}