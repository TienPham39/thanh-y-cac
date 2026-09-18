"use client";

import { AnimatedProductCard } from "./animated-product-card";
import { PageReveal } from "./page-reveal";
import Image from "next/image";
import Link from "next/link";
import { useSiteState } from "./site-layout";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import {
  categories,
  products,
  rentalSteps,
  formatPrice,
  type Product,
} from "@/lib/home-data";

const slides = ["banner-3.png", "banner-1.png", "banner-2.png?v=20260918-1612"];
type Panel =
  | { kind: "product"; product: Product }
  | { kind: "favorites" }
  | { kind: "cart" }
  | { kind: "booking" }
  | { kind: "info"; title: string; text: string };

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [category, setCategory] = useState(categories[0]);
  const { favorites, setFavorites, cart, setCart } = useSiteState();
  const [panel, setPanel] = useState<Panel | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!panel) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [panel]);

  const visibleProducts = products.filter(
    (product) => category === categories[0] || product.category === category,
  );
  const toggleFavorite = (id: string) =>
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const addToCart = (id: string) =>
    setCart((current) => (current.includes(id) ? current : [...current, id]));
  const contactLinks = (
    <div className="contact-actions">
      <a className="button button-primary" href="tel:0779312303">
        <Icon name="phone" />
        Gọi 0779 312 303
      </a>
      <a
        className="button button-outline"
        href="https://zalo.me/0779312303"
        target="_blank"
        rel="noreferrer"
      >
        <Icon name="chat" />
        Nhắn tin Zalo
      </a>
    </div>
  );

  return (
    <>
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <PageReveal />
      <main id="main">
        <section
          className="hero"
          aria-label="Trang phục cổ trang Thanh Y Các"
          aria-roledescription="băng chuyền"
        >
          {slides.map((image, index) => (
            <Image
              key={image}
              src={`/images/${image}`}
              alt={
                index === 0
                  ? "Cổ phục xanh thêu hoa văn tinh tế với quạt tròn"
                  : "Hán phục và phụ kiện trong không gian cổ phong"
              }
              fill
              priority={index === 0}
              sizes="100vw"
              className={`hero-image !object-top max-[760px]:!object-[62%_top] ${index === slide ? "is-active" : ""}`}
              aria-hidden={index !== slide}
            />
          ))}
          <div className="hero-shade" />
          <div className="relative z-[2] container hero-inner">
            <div className="hero-copy">
              <p data-page-reveal className="hero-eyebrow">THANH Y CÁC | TRANG PHỤC CỔ TRANG</p>
              <h1 data-page-reveal>
                <em>Lựa Chọn</em>
                <br />
                Trang Phục
                <br />
                <span>Yêu Thích Của Bạn</span>
              </h1>
              <p data-page-reveal className="hero-description">
                Chuyên cho thuê trang phục{" "}
                <strong>Hán Phục · Tiên Hiệp · Võ Hiệp · Cung Đình</strong> theo
                phong cách điện ảnh Á Đông. Phục vụ chụp ảnh, studio và biểu
                diễn sân khấu.
              </p>
              <div data-page-reveal className="hero-actions">
                <a href="#bo-suu-tap" className="button button-primary">
                  Khám phá trang phục
                </a>
                <a href="#quy-trinh" className="button button-gold">
                  Hướng dẫn thuê
                </a>
              </div>
              <dl data-page-reveal className="hero-stats">
                <div>
                  <dt>150+</dt>
                  <dd>Trang phục</dd>
                </div>
                <div>
                  <dt>500+</dt>
                  <dd>Khách hàng</dd>
                </div>
                <div>
                  <dt>4+</dt>
                  <dd>Năm kinh nghiệm</dd>
                </div>
              </dl>
            </div>
            <div data-page-reveal className="slider-controls">
              <button
                aria-label="Banner trước"
                onClick={() =>
                  setSlide((slide + slides.length - 1) % slides.length)
                }
              >
                <Icon name="chevron" className="rotate-180" />
              </button>
              <button
                aria-label="Banner tiếp theo"
                onClick={() => setSlide((slide + 1) % slides.length)}
              >
                <Icon name="chevron" />
              </button>
              <div className="slider-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={slide === index ? "active" : ""}
                    aria-label={`Chuyển đến banner ${index + 1}`}
                    aria-pressed={slide === index}
                    onClick={() => setSlide(index)}
                  />
                ))}
              </div>
              <span className="sr-only" aria-live="polite">
                Banner {slide + 1} trên {slides.length}
              </span>
            </div>
          </div>
        </section>

        <section className="collection section-space" id="bo-suu-tap">
          <div className="relative z-[2] container">
            <div data-page-reveal className="section-heading">
              <p className="section-tag">❖ PHỤC TRANG THƯỢNG HẠNG ❖</p>
              <h2>Bộ Sưu Tập Tiêu Biểu</h2>
              <p>
                Được phục chế tỉ mỉ theo đúng chuẩn phom dáng từng triều đại,
                chất vải gấm, tơ, sa
                <br className="desktop-break" /> lụa thêu thủ công tinh tế.
              </p>
            </div>
            <div
              data-page-reveal className="category-tabs"
              role="group"
              aria-label="Lọc trang phục"
            >
              {categories.map((item) => (
                <button
                  key={item}
                  aria-pressed={category === item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="product-grid" aria-live="polite">
              {visibleProducts.map((product) => (
                <AnimatedProductCard className="product-card" key={product.id}>
                  <Link
                    href="/trang-phuc"
                    className="product-picture"
                    aria-label={`Xem ${product.name}`}
                  >
                    <Image
                      src="/images/logo.png"
                      alt={product.name}
                      fill
                      sizes="(max-width: 460px) 90vw, (max-width: 900px) 45vw, 23vw"
                    />
                    <span className={`product-badge ${product.tone}`}>
                      {product.badge}
                    </span>
                    <span className="accessory">{product.accessory}</span>
                  </Link>
                  <div className="product-body">
                    <p className="product-label">{product.label}</p>
                    <h3>
                      <Link href="/trang-phuc">{product.name}</Link>
                    </h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">
                      <div>
                        <span>Giá thuê 24h</span>
                        <strong>{formatPrice(product.price)}</strong>
                      </div>
                      <button
                        className="calendar-button"
                        aria-label={`Đặt thuê ${product.name}`}
                        onClick={() => {
                          addToCart(product.id);
                          setPanel({ kind: "cart" });
                        }}
                      >
                        <Icon name="calendar" />
                      </button>
                    </div>
                  </div>
                </AnimatedProductCard>
              ))}
              {visibleProducts.length === 0 && (
                <div className="empty-state">
                  <Icon name="hanger" />
                  <h3>Bộ sưu tập đang được cập nhật</h3>
                  <p>Liên hệ để được tư vấn thêm về Hán phục cách tân.</p>
                  <button
                    className="button button-outline"
                    onClick={() => setCategory(categories[0])}
                  >
                    Xem tất cả trang phục
                  </button>
                </div>
              )}
            </div>
            <div data-page-reveal className="collection-more">
              <Link href="/trang-phuc" className="button button-outline">
                Tất cả sản phẩm <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="rental section-space" id="quy-trinh">
          <div className="relative z-[2] container">
            <div data-page-reveal className="section-heading">
              <p className="eyebrow">TRẢI NGHIỆM AN TÂM & NHANH CHÓNG</p>
              <h2>Quy Trình Thuê Đồ Chuẩn 4 Bước</h2>
              <p>
                Thanh Y Các tối ưu hóa mọi thủ tục để quý khách có thể hóa thân
                thành nhân vật cổ
                <br className="desktop-break" /> trang trọn vẹn nhất.
              </p>
            </div>
            <ol className="steps-grid">
              {rentalSteps.map((step, index) => (
                <li data-page-reveal key={step.title}>
                  <span className="step-number">0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="contact-banner" id="lien-he">
          <div data-page-reveal className="relative z-[2] container">
            <h2>Hóa Thân Vào Khung Hình Cổ Phong Ngay Hôm Nay</h2>
            <p>
              Liên hệ ngay hotline <a href="tel:0779312303">0779 312 303</a>{" "}
              hoặc nhắn tin để giữ mẫu trang
              <br className="desktop-break" /> phục yêu thích cùng ưu đãi miễn
              phí phụ kiện cao cấp.
            </p>
            <div className="contact-actions">
              <a className="button button-cream" href="tel:0779312303">
                <Icon name="phone" />
                Gọi 0779 312 303 (Tư vấn 24/7)
              </a>
              <a
                className="button button-light"
                href="https://zalo.me/0779312303"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="chat" />
                Nhắn Tin Zalo Studio
              </a>
            </div>
          </div>
        </section>
      </main>

      <dialog
        ref={dialog}
        className="detail-dialog"
        onCancel={() => setPanel(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
        aria-labelledby="dialog-title"
      >
        {panel && (
          <div className="dialog-content">
            <button
              autoFocus
              className="icon-button dialog-close"
              aria-label="Đóng"
              onClick={() => setPanel(null)}
            >
              <Icon name="close" />
            </button>
            {panel.kind === "product" ? (
              <>
                <p className="eyebrow">{panel.product.label}</p>
                <h2 id="dialog-title">{panel.product.name}</h2>
                <p>{panel.product.description}</p>
                <p className="dialog-price">
                  {formatPrice(panel.product.price)} <small>/ 24 giờ</small>
                </p>
                <p className="dialog-note">
                  Mẫu giới thiệu. Vui lòng liên hệ để xác nhận giá, kích cỡ và
                  lịch còn trống.
                </p>
                <div className="contact-actions">
                  <button
                    className="button button-outline"
                    aria-pressed={favorites.includes(panel.product.id)}
                    onClick={() => toggleFavorite(panel.product.id)}
                  >
                    <Icon name="heart" />
                    {favorites.includes(panel.product.id)
                      ? "Đã yêu thích"
                      : "Lưu yêu thích"}
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => {
                      addToCart(panel.product.id);
                      setPanel({ kind: "cart" });
                    }}
                  >
                    Chọn thuê <Icon name="arrow" />
                  </button>
                </div>
              </>
            ) : panel.kind === "favorites" || panel.kind === "cart" ? (
              <>
                <h2 id="dialog-title">
                  {panel.kind === "favorites"
                    ? "Trang phục yêu thích"
                    : "Trang phục đã chọn"}
                </h2>
                {products
                  .filter((item) =>
                    (panel.kind === "favorites" ? favorites : cart).includes(
                      item.id,
                    ),
                  )
                  .map((item) => (
                    <div className="saved-item" key={item.id}>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{formatPrice(item.price)} / 24h</p>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={`Bỏ ${item.name}`}
                        onClick={() =>
                          panel.kind === "favorites"
                            ? toggleFavorite(item.id)
                            : setCart(cart.filter((id) => id !== item.id))
                        }
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  ))}
                {(panel.kind === "favorites" ? favorites : cart).length ===
                0 ? (
                  <p>
                    Chưa có trang phục nào. Khám phá bộ sưu tập và chọn mẫu bạn
                    yêu thích.
                  </p>
                ) : (
                  <p className="dialog-note">
                    Danh sách được giữ trong phiên xem trang. Liên hệ để xác
                    nhận lịch thuê; chưa có đơn đặt thuê được gửi.
                  </p>
                )}
                {contactLinks}
              </>
            ) : panel.kind === "booking" ? (
              <>
                <p className="eyebrow">HẸN GẶP TẠI THANH Y CÁC</p>
                <h2 id="dialog-title">Đặt lịch thử trang phục</h2>
                <p>
                  Gọi hoặc nhắn Zalo để chọn ngày, giờ và mẫu trang phục bạn
                  muốn thử.
                </p>
                <p>
                  583/66 đường 30 tháng 4, TP. Cần Thơ
                  <br />
                  Mở cửa: 08:30 – 21:30 hằng ngày.
                </p>
                {contactLinks}
              </>
            ) : (
              <>
                <h2 id="dialog-title">{panel.title}</h2>
                <p>{panel.text}</p>
                {contactLinks}
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
