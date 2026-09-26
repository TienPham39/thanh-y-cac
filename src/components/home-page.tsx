"use client";

import { HomeCollection } from "./home-collection";
import { PageReveal } from "./page-reveal";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./icon";
import { rentalSteps } from "@/lib/home-data";

const slides = ["banner-3.webp", "banner-1.webp", "banner-2.webp"];
export default function HomePage() {
  const [slide, setSlide] = useState(0);

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
            <HomeCollection />
            <div data-page-reveal className="collection-more">
              <Link href="/trang-phuc" className="button button-outline">
                Tất cả sản phẩm
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


    </>
  );
}
