import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thanh Y Các",
  description: "Không gian số của Thanh Y Các.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
