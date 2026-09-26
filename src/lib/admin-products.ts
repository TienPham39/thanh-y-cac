export type AdminProduct = {
  id: string; code: string; slug: string; name: string; category: string;
  status: string; gender: string; description: string; details: string;
  images: string[]; tags: string; badge: string; collection: string;
  price: number; extraDay: number; deposit: number; accessoryFee: number; offer: string;
  minHeight: number; maxHeight: number; minWeight: number; maxWeight: number;
  fitNote: string; material: string; accessories: string; components: string; componentImages: string[];
  cleaning: string; rentalPolicy: string; damagePolicy: string;
  published: boolean; featured: boolean; onlineBooking: boolean; showLikes: boolean;
  rentalCount: number; likes: number; rating: number; reviewCount: number;
  calendar: Record<string, string>;
};
export const categories = ["Cung đình", "Tiên hiệp", "Cổ phục", "Hỷ phục", "Dân Quốc", "Kiếm hiệp"];
export const statuses = ["Sẵn sàng", "Cần đặt trước", "Cần bảo trì"];
export const badges = ["Nổi bật", "Mẫu mới", "Được yêu thích"] as const;
export function blankProduct(): AdminProduct {
  return { id: crypto.randomUUID(), code: "", slug: "", name: "", category: categories[0], status: statuses[0], gender: "Nữ", description: "", details: "", images: [], tags: "", badge: "", collection: "", price: 0, extraDay: 0, deposit: 0, accessoryFee: 0, offer: "", minHeight: 155, maxHeight: 172, minWeight: 45, maxWeight: 65, fitNote: "", material: "", accessories: "", components: "", componentImages: [], cleaning: "", rentalPolicy: "", damagePolicy: "", published: false, featured: false, onlineBooking: false, showLikes: true, rentalCount: 0, likes: 0, rating: 0, reviewCount: 0, calendar: {} };
}
export function sampleProducts(): AdminProduct[] {
  return ["Phượng Cầu Hoàng - Đại Triều Cung Phục Nữ", "Lam Sắc Cửu Vĩ Tiên Nhu", "Thúy Trúc Minh Triều Phi Phong", "Phượng Hoàng Vũ Phi Hỷ Phục", "Bích Ngọc Dân Quốc Kỳ Bào", "Nguyệt Hạ Độc Hành Đạo Bào"].map((name, i) => ({
    ...blankProduct(), id: `sample-${i}`, name, code: ["TYC-CD08", "TYC-TH12", "TYC-MT05", "TYC-HP03", "TYC-DQ02", "TYC-KH08"][i], slug: `trang-phuc-mau-${i + 1}`, category: categories[i], status: statuses[i === 0 || i === 4 ? 1 : i === 5 ? 2 : 0],
    images: [i % 2 ? "/images/example-2.png" : "/images/example-1.png"], price: [450000, 380000, 420000, 680000, 290000, 350000][i], deposit: i === 0 ? 1000000 : 800000, extraDay: 150000,
    description: "Trang phục cổ phong với hoa văn thêu tinh xảo, phù hợp cho chụp ảnh, sự kiện và biểu diễn.", material: "Gấm, lụa, thêu kim tuyến", accessories: "Mũ phượng, trâm cài, vòng cổ, khăn vai", components: "01 Áo lót trong giao lĩnh lụa trắng\n01 Áo chính thêu họa tiết\n01 Chân váy xếp ly\n01 Đai lưng", tags: "Cung đình, Hoàng gia, Đại lễ", badge: "Đại Triều Minh Cung · Độc quyền", collection: "Hoàng triều", published: true, onlineBooking: true, rentalCount: [540, 328, 276, 190, 312, 205][i],
  }));
}
export const storageKey = "thanh-y-cac-admin-drafts-v1";
export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
