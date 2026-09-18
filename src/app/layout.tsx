import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/vietnamese-700.css";
import "@fontsource/inter/vietnamese-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/vietnamese-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/vietnamese-600.css";
import "@fontsource/noto-serif/latin-400.css";
import "@fontsource/noto-serif/vietnamese-400.css";
import "@fontsource/noto-serif/latin-400-italic.css";
import "@fontsource/noto-serif/vietnamese-400-italic.css";
import "@fontsource/noto-serif/latin-500.css";
import "@fontsource/noto-serif/vietnamese-500.css";
import "@fontsource/noto-serif/latin-600.css";
import "@fontsource/noto-serif/vietnamese-600.css";
import "@fontsource/noto-serif/latin-700.css";
import "@fontsource/noto-serif/vietnamese-700.css";
import "./globals.css";
import SiteLayout from "@/components/site-layout";

export const metadata: Metadata = {
  title: "Thanh Y Các",
  icons: { icon: "/images/favicon.png", apple: "/images/favicon.png" },
  description:
    "Thanh Y Các — Cho thuê Hán phục, cổ phục, trang phục kiếm hiệp và sườn xám tại Cần Thơ. Liên hệ 0779 312 303 để được tư vấn và đặt lịch thử đồ.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
