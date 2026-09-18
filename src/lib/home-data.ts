export const categories = [
  "Tất cả",
  "Cung Đình & Lễ Phục",
  "Kiếm Hiệp & Tiên Hiệp",
  "Thục Nữ Dân Quốc - Sườn Xám",
  "Hán Phục Cách Tân",
];

// Display content supplied in the reference, not live inventory.
export const products = [
  {
    id: "phuong-vu",
    name: "Đường Chế Tề Ngực - Phượng Vũ",
    category: categories[1],
    label: "CUNG ĐÌNH ĐƯỜNG TRIỀU",
    badge: "NỔI BẬT",
    tone: "red",
    accessory: "Full phụ kiện",
    description:
      "Lụa cao cấp phối sa thêu chỉ vàng, kèm quạt tròn và trâm phượng hoàng uy nghi.",
    price: 280000,
  },
  {
    id: "linh-ma",
    name: "Minh Chế Áo Viên Lĩnh Mã Diện",
    category: categories[1],
    label: "MINH CHẾ ĐOAN TRANG",
    badge: "MỚI VỀ",
    tone: "green",
    accessory: "Lễ phục",
    description:
      "Váy mã diện dệt gấm hoa cúc kim tuyến, cúc ngọc bạch thanh nhã, tôn dáng thanh.",
    price: 320000,
  },
  {
    id: "tam-kiem",
    name: "Bạch Y Hiệp Nữ Tầm Kiếm",
    category: categories[2],
    label: "KIẾM HIỆP & TIÊN TỬ",
    badge: "HOT CONCEPT",
    tone: "gold",
    accessory: "Kèm kiếm",
    description:
      "Chất sa trắng phiêu dật, đai da đinh ngọc, kèm nón mạng che mặt và thanh bảo kiếm.",
    price: 250000,
  },
  {
    id: "do-ruou",
    name: "Sườn Xám Nhung Đỏ Rượu",
    category: categories[3],
    label: "THỤC NỮ DÂN QUỐC",
    badge: "THƯỢNG HẢI",
    tone: "red",
    accessory: "Nhung the",
    description:
      "Form dáng tôn đường cong Á Đông, khuy cài ngọc bích vintage, kèm khăn lông & phụ kiện.",
    price: 220000,
  },
];
export type Product = (typeof products)[number];
export const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

export const rentalSteps = [
  {
    title: "Chọn Phục Trang & Concept",
    text: "Xem mẫu qua website, fanpage hoặc nhận tư vấn riêng từ stylist về màu sắc phù hợp với tone da và concept định chụp.",
  },
  {
    title: "Thử Đồ Tại Phòng Thử",
    text: "Ghé 583/66 đường 30 tháng 4, TP. Cần Thơ để thử form trực tiếp. Nhân viên hỗ trợ tư vấn và chỉnh sửa vừa vặn từng chi tiết.",
  },
  {
    title: "Đặt Cọc & Nhận Trang Phục",
    text: "Thủ tục đặt cọc linh hoạt (CCCD hoặc cọc tiền mặt). Trang phục được là phẳng thơm tho kèm đầy đủ trâm cài, trang sức.",
  },
  {
    title: "Hoàn Trả & Nhận Lại Cọc",
    text: "Trả đồ tại cửa hàng hoặc gửi ship. Thanh Y Các tự chịu trách nhiệm giặt là khử khuẩn chuyên sâu sau mỗi lượt thuê.",
  },
];
