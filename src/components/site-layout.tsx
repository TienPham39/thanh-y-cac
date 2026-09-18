"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
const CherryBlossomParticles = dynamic(() => import("./CherryBlossomParticles"), { ssr: false });
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Icon, type IconName } from "./icon";
type State = {
  favorites: string[];
  setFavorites: Dispatch<SetStateAction<string[]>>;
  cart: string[];
  setCart: Dispatch<SetStateAction<string[]>>;
};
const Context = createContext<State | null>(null);
export function useSiteState() {
  const value = useContext(Context);
  if (!value) throw Error("Site layout missing");
  return value;
}
const support: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "book",
    title: "Quy trình thuê & đặt cọc",
    text: "Chọn trang phục, thử đồ, đặt cọc và nhận trang phục, sau đó hoàn trả để nhận lại cọc. Vui lòng liên hệ phòng thử để xác nhận mức cọc cho bộ trang phục bạn chọn.",
  },
  {
    icon: "money",
    title: "Biểu phí thuê theo 24h / 48h",
    text: "Giá hiển thị trên trang là giá thuê 24 giờ theo mẫu giới thiệu. Liên hệ Thanh Y Các để xác nhận giá hiện tại và báo giá thuê 48 giờ.",
  },
  {
    icon: "shield",
    title: "Chính sách giặt là bảo quản",
    text: "Thanh Y Các giặt là và khử khuẩn trang phục sau mỗi lượt thuê. Vui lòng giữ trang phục khô ráo và liên hệ cửa hàng nếu cần hỗ trợ bảo quản.",
  },
  {
    icon: "users",
    title: "Hợp tác Studio & Nhiếp ảnh gia",
    text: "Thanh Y Các đón nhận các đề xuất hợp tác chụp ảnh cổ phong. Liên hệ 0779 312 303 để trao đổi concept, trang phục và lịch chụp.",
  },
  {
    icon: "hanger",
    title: "Cẩm nang phối trang sức cổ trang",
    text: "Chọn phụ kiện theo kiểu trang phục và concept chụp. Đội ngũ tư vấn sẽ hỗ trợ phối trâm cài, quạt và trang sức khi bạn đến thử đồ.",
  },
];
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const home = usePathname() === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [panel, setPanel] = useState<{
    kind: string;
    title?: string;
    text?: string;
  } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const showInfo = (item: (typeof support)[number]) =>
    setPanel({ kind: "info", title: item.title, text: item.text });
  useEffect(() => {
    if (!panel) return;
    const modal = dialog.current;
    modal?.showModal();
    return () => modal?.close();
  }, [panel]);
  return (
    <Context.Provider value={{ favorites, setFavorites, cart, setCart }}>
      <CherryBlossomParticles />
      {" "}
      <header className="site-header isolate overflow-x-clip bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2 bg-[url('/images/bg-header.png')] bg-[length:80vw_auto] bg-left bg-no-repeat"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2 bg-[url('/images/bg-header.png')] bg-[length:80vw_auto] bg-right bg-no-repeat"
        />
        <div className="header-inner container">
          <Link
            href="/"
            className="brand-link"
            aria-label="Thanh Y Các — Trang chủ"
          >
            <Image
              src="/images/logo2.png"
              width={220}
              height={74}
              className="!w-[210px] max-[1200px]:!w-[180px] max-[760px]:!w-[160px]"
              alt="Thanh Y Các"
              priority
            />
          </Link>
          <Image
            className="header-ornament"
            src="/images/line.png"
            width={16}
            height={48}
            alt=""
          />
          <nav
            className={`main-nav ${menuOpen ? "is-open" : ""}`}
            id="main-navigation"
            aria-label="Điều hướng chính"
          >
            <Link
              href="/"
              className={
                home
                  ? "relative rounded-[14px] bg-[#f9eae5] !font-semibold !text-[#80151c]"
                  : ""
              }
              aria-current={home ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              Trang chủ
              {home && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 left-1/2 flex w-14 -translate-x-1/2 items-center justify-center gap-1.5 max-[760px]:hidden"
                >
                  <span className="h-px flex-1 bg-[#80151c]" />
                  <span className="h-1.5 w-1.5 rotate-45 border border-[#80151c]" />
                  <span className="h-px flex-1 bg-[#80151c]" />
                </span>
              )}
            </Link>
            <Link
              href="/trang-phuc"
              aria-current={!home ? "page" : undefined}
              className={
                !home
                  ? "relative rounded-[14px] bg-[#f9eae5] !font-semibold !text-[#80151c]"
                  : ""
              }
              onClick={() => setMenuOpen(false)}
            >
              Thuê trang phục
              {!home && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 left-1/2 flex w-14 -translate-x-1/2 items-center justify-center gap-1.5 max-[760px]:hidden"
                >
                  <span className="h-px flex-1 bg-[#80151c]" />
                  <span className="h-1.5 w-1.5 rotate-45 border border-[#80151c]" />
                  <span className="h-px flex-1 bg-[#80151c]" />
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                setMenuOpen(false);
                setPanel({
                  kind: "info",
                  title: "Blogs · Cẩm nang cổ phong",
                  text: "Các bài viết đang được chuẩn bị. Bạn có thể xem hướng dẫn thuê trên trang hoặc liên hệ Thanh Y Các để được tư vấn chọn trang phục và concept chụp ảnh.",
                });
              }}
            >
              Tin tức
            </button>
            <Link href="/#ve-chung-toi" onClick={() => setMenuOpen(false)}>
              Về chúng tôi
            </Link>
          </nav>
          <div className="header-actions">
            <Image
              className="header-ornament ornament-right"
              src="/images/line.png"
              width={14}
              height={42}
              alt=""
            />
            <button
              className="icon-button"
              aria-label={`Yêu thích (${favorites.length})`}
              onClick={() => setPanel({ kind: "favorites" })}
            >
              <Icon name="heart" />
              {favorites.length > 0 && (
                <span className="count">{favorites.length}</span>
              )}
            </button>
            <button
              className="icon-button"
              aria-label={`Giỏ trang phục (${cart.length})`}
              onClick={() => setPanel({ kind: "cart" })}
            >
              <Icon name="cart" />
              {cart.length > 0 && <span className="count">{cart.length}</span>}
            </button>
            <button
              className="button button-primary header-booking font-['Inter'] !border-[#B88632]"
              onClick={() => setPanel({ kind: "booking" })}
            >
              <Icon name="calendar" className="text-[#FFDEAC]" />
              Đặt lịch ngay <Icon name="arrow" className="text-[#FFDEAC]" />
            </button>
            <button
              className="icon-button menu-toggle"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      {children}{" "}
      <footer className="site-footer" id="ve-chung-toi">
        <div className="container footer-grid">
          <div className="footer-about">
            <Link href="/" aria-label="Thanh Y Các — Trang chủ">
              <Image
                src="/images/logo2.png"
                alt="Thanh Y Các"
                width={190}
                height={64}
              />
            </Link>
            <p>
              Không gian phục dựng và lưu giữ tinh hoa y phục phương Đông. Cung
              cấp dịch vụ cho thuê cổ phục Hán phục, trang phục truyền thống,
              đạo cụ cổ phong và tổ chức concept ảnh nghệ thuật chuẩn mực tại
              Cần Thơ.
            </p>
            <div className="footer-benefits">
              <div>
                <Icon name="clock" />
                <span>
                  <strong>08:30 - 21:30</strong>
                  <small>hằng ngày</small>
                </span>
              </div>
              <div>
                <Icon name="shield" />
                <span>
                  <strong>Chỉnh phục cao cấp</strong>
                  <small>Tinh tế trong từng chi tiết</small>
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3>Chính Sách & Hỗ Trợ</h3>
            <Image
              className="footer-rule"
              src="/images/line2.png"
              alt=""
              width={76}
              height={25}
            />
            <ul className="footer-links">
              {support.map((item) => (
                <li key={item.title}>
                  <button onClick={() => showInfo(item)}>
                    <span className="footer-icon">
                      <Icon name={item.icon} />
                    </span>
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Liên Hệ & Phòng Thử</h3>
            <Image
              className="footer-rule"
              src="/images/line2.png"
              alt=""
              width={76}
              height={25}
            />
            <address>
              <ul className="footer-links">
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=583%2F66%20%C4%91%C6%B0%E1%BB%9Dng%2030%20th%C3%A1ng%204%20C%E1%BA%A7n%20Th%C6%A1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="footer-icon">
                      <Icon name="pin" />
                    </span>
                    583/66 đường 30 tháng 4, Tp. Cần Thơ
                  </a>
                </li>
                <li>
                  <a href="tel:0779312303">
                    <span className="footer-icon">
                      <Icon name="phone" />
                    </span>
                    0779 312 303
                  </a>
                </li>
                <li>
                  <a
                    href="https://zalo.me/0779312303"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="footer-icon">
                      <Icon name="chat" />
                    </span>
                    Zalo OA: Thanh Y Các.
                  </a>
                </li>
                <li>
                  <span className="footer-contact">
                    <span className="footer-icon">
                      <Icon name="mail" />
                    </span>
                    @thanhycac.vn
                  </span>
                </li>
              </ul>
            </address>
          </div>
        </div>
      </footer>
      <dialog
        ref={dialog}
        onCancel={() => setPanel(null)}
        aria-labelledby="site-dialog-title"
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[#eddad2] bg-white p-6 backdrop:bg-black/50"
      >
        {panel && (
          <>
            <button
              autoFocus
              onClick={() => setPanel(null)}
              aria-label="Đóng"
              className="ml-auto flex h-11 w-11 items-center justify-center text-[#80151c]"
            >
              <Icon name="close" />
            </button>
            <h2
              id="site-dialog-title"
              className="mb-4 text-2xl font-bold text-[#80151c]"
            >
              {panel.title ??
                (panel.kind === "favorites"
                  ? "Trang phục yêu thích"
                  : panel.kind === "cart"
                    ? "Giỏ trang phục"
                    : "Đặt lịch thử trang phục")}
            </h2>
            <p className="text-sm leading-relaxed">
              {panel.text ??
                (panel.kind === "favorites"
                  ? "Đã lưu " +
                    favorites.length +
                    " mẫu trong phiên này. Xem bộ sưu tập để chọn và liên hệ kiểm tra lịch."
                  : panel.kind === "cart"
                    ? "Bạn đã chọn " +
                      cart.length +
                      " mẫu. Liên hệ cửa hàng để xác nhận trang phục và lịch thử."
                    : "Ghé 583/66 đường 30 tháng 4, TP. Cần Thơ. Gọi 0779 312 303 hoặc nhắn Zalo để xác nhận lịch thử.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/trang-phuc"
                onClick={() => setPanel(null)}
                className="rounded-lg border border-[#80151c] px-4 py-3 text-sm text-[#80151c]"
              >
                Xem trang phục
              </Link>
              <a
                href="https://zalo.me/0779312303"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#80151c] px-4 py-3 text-sm text-white"
              >
                Nhắn Zalo
              </a>
              <a
                href="tel:0779312303"
                className="rounded-lg border border-[#80151c] px-4 py-3 text-sm text-[#80151c]"
              >
                Gọi 0779 312 303
              </a>
            </div>
          </>
        )}
      </dialog>
    </Context.Provider>
  );
}
