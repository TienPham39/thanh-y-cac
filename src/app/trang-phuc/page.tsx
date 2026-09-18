import type { Metadata } from "next";
import { Suspense } from "react";
import CatalogPage from "@/components/catalog-page";
export const metadata: Metadata = {
  title: "Danh sách trang phục | Thanh Y Các",
  description:
    "Khám phá cổ phục cung đình, Hán phục, tiên hiệp và sườn xám tại Thanh Y Các, Cần Thơ.",
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="p-12 text-center">Đang tải danh sách trang phục…</p>
      }
    >
      <CatalogPage />
    </Suspense>
  );
}
