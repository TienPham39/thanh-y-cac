import { Icon, type IconName } from "./icon";

const policies: { number: string; icon: IconName; title: string; text: string; note: string }[] = [
  { number: "01", icon: "sparkles", title: "Quy Trình Giặt Hấp Chuyên Sâu", text: "Trang phục được kiểm tra, giặt hấp và khử khuẩn sau mỗi lượt thuê. Những chi tiết thêu, đính kết được bảo quản riêng để giữ phom dáng.", note: "Chi phí vệ sinh cơ bản đã gồm trong giá thuê" },
  { number: "02", icon: "clock", title: "Thời Gian Tính Thuê Linh Hoạt", text: "Giá hiển thị áp dụng cho 24 giờ. Nếu cần nhận sớm, trả muộn hoặc thuê nhiều ngày, cửa hàng sẽ báo lại mức phí trước khi xác nhận.", note: "Phòng thử mở cửa 08:30–21:30 hằng ngày" },
  { number: "03", icon: "shield", title: "Bồi Hoàn & Trách Nhiệm", text: "Khách hàng kiểm tra tình trạng trang phục khi nhận. Trường hợp hư hỏng hoặc thất lạc, mức bồi hoàn được trao đổi theo tình trạng thực tế.", note: "Biên nhận kèm danh sách phụ kiện khi nhận đồ" },
];

export default function ProductPolicies() {
  return (
    <section className="relative z-[2] mt-10 w-full border-y border-[#e6e2de] bg-[#f7f6f4] px-4 py-12 sm:px-8 lg:px-6">
      <div className="mx-auto w-full max-w-[1120px]">
      <div className="mb-7 text-center lg:mb-5">
        <p className="font-['Inter'] text-xs font-semibold tracking-[0.2em] text-[#9a6d16]">QUY TẮC THANH Y CÁC</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#74131b] sm:text-3xl lg:text-2xl">Chính sách & hướng dẫn bảo quản</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3 lg:gap-4">
        {policies.map((policy) => (
          <article key={policy.number} className="bg-white p-6 lg:p-4">
            <span className="flex h-10 w-10 lg:h-8 lg:w-8 items-center justify-center rounded bg-[#80151c] font-['Inter'] text-sm font-bold text-white">{policy.number}</span>
            <h3 className="mt-5 lg:mt-3 flex items-center gap-2 text-lg lg:text-base font-semibold text-[#74131b]"><Icon name={policy.icon} className="!h-4 !w-4 text-[#9a6d16]" />{policy.title}</h3>
            <p className="mt-4 lg:mt-3 font-['Inter'] text-sm leading-7 lg:leading-6 text-[#765f5a]">{policy.text}</p>
            <p className="mt-5 lg:mt-3 border-t border-[#ead7d0] pt-4 lg:pt-3 font-['Inter'] text-xs font-semibold leading-6 text-[#73500f]">{policy.note}</p>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
