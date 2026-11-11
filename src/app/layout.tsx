import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Gestion Hôpital" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(saved) ? saved : DEFAULT_THEME;

  return (
    <html lang="fr" data-theme={theme}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
