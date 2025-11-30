import { ReactNode } from "react";
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Language Practice App",
  description: "Learn Mandarin through interactive lessons",
  themeColor: "#0f172a",
  manifest: "/manifest.json",
  icons: {
    icon: "/vite.svg",
    apple: "/vite.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
