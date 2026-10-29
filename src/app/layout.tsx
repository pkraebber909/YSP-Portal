import type { Metadata } from "next";
import "./globals.css";
import "@/lib/db";

export const metadata: Metadata = { title: "YSP Portal", description: "Youth Soccer Portal workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
