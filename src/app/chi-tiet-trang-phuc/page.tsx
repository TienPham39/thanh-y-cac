import { Suspense } from "react";
import StaticProductDetail from "@/components/static-product-detail";

export const metadata = { title: "Chi tiết trang phục | Thanh Y Các" };

export default function Page() {
  return <Suspense fallback={<p className="p-12 text-center">Đang tải trang phục…</p>}>
    <StaticProductDetail />
  </Suspense>;
}
