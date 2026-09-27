"use client";
import ProductRentalCalendar from "./product-rental-calendar";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AdminProduct } from "@/lib/admin-products";
import { badges, money, nextProductCode } from "@/lib/admin-products";
import type { AdminCategory } from "@/lib/admin-categories";
import {
  imageSelectionError,
  MAX_IMAGE_EDGE,
  TARGET_IMAGE_BYTES,
} from "@/lib/admin-image-upload";
import {
  normalizeProductComponents,
  parseProductComponents,
} from "@/lib/admin-product-components";
import { buttonStyle, primaryStyle, inputStyle } from "./admin-shell";
import AdminSelect from "./admin-select";
import ConfirmDialog from "./confirm-dialog";
import ToastViewport, { type ToastTone } from "./toast";

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-[#e7e6e9] bg-white p-5 ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-[#80151c]">{title}</h2>
      {children}
    </section>
  );
}

function readFile(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được tệp ảnh."));
    reader.readAsDataURL(file);
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Không thể tối ưu ảnh.")),
      "image/webp",
      quality,
    );
  });
}

async function optimizeImage(file: File) {
  if (file.size <= TARGET_IMAGE_BYTES) return readFile(file);

  const bitmap = await createImageBitmap(file);
  try {
    const initialScale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

    let result: Blob | null = null;
    for (let pass = 0; pass < 3; pass += 1) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [0.86, 0.76, 0.66, 0.56]) {
        result = await canvasBlob(canvas, quality);
        if (result.size <= TARGET_IMAGE_BYTES) return readFile(result);
      }
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
    return readFile(result ?? file);
  } finally {
    bitmap.close();
  }
}

export default function ProductEditor({
  initial,
  existingProducts,
  categoryRows,
  save,
  back,
}: {
  initial: AdminProduct;
  existingProducts: AdminProduct[];
  categoryRows: AdminCategory[];
  save: (product: AdminProduct, draft: boolean) => Promise<AdminProduct | null>;
  back: () => void;
}) {
  const categories = categoryRows.map((row) => row.name);
  const normalizedInitial = {
    ...initial,
    badge: badges.includes(initial.badge as (typeof badges)[number])
      ? initial.badge
      : badges[0],
  };
  const [p, setP] = useState(normalizedInitial);
  const [saved, setSaved] = useState(JSON.stringify(normalizedInitial));
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [componentItems, setComponentItems] = useState(() =>
    parseProductComponents(initial.components),
  );
  const [componentImages, setComponentImages] = useState(() =>
    parseProductComponents(initial.components).map(
      (_, index) => initial.componentImages[index] ?? "",
    ),
  );
  const leaveAction = useRef<(() => void) | null>(null);
  const componentList = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(p) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      leaveAction.current = () => window.location.assign(link.href);
      setLeaveOpen(true);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  function requestBack() {
    if (!dirty) {
      back();
      return;
    }
    leaveAction.current = back;
    setLeaveOpen(true);
  }
  function confirmLeave() {
    const action = leaveAction.current;
    leaveAction.current = null;
    setLeaveOpen(false);
    action?.();
  }
  const [notification, setNotification] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);
  const preview = useRef<HTMLDialogElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setP((old) => ({
      ...old,
      [key]: value,
      ...(key === "category" &&
      !existingProducts.some((product) => product.id === initial.id)
        ? {
            code: nextProductCode(
              String(value),
              existingProducts,
              Object.fromEntries(
                categoryRows.map((row) => [row.name, row.codePrefix || ""]),
              ),
            ),
          }
        : {}),
    }));
  function updateComponentItems(items: string[], images = componentImages) {
    setComponentItems(items);
    setComponentImages(images);
    setP((old) => ({
      ...old,
      components: items.join("\n"),
      componentImages: images,
    }));
  }
  function addComponentItem() {
    updateComponentItems([...componentItems, ""], [...componentImages, ""]);
    requestAnimationFrame(() =>
      componentList.current
        ?.querySelector<HTMLInputElement>("input:last-of-type")
        ?.focus(),
    );
  }
  async function uploadComponentImage(index: number, file?: File) {
    if (!file) return;
    const validationError = imageSelectionError([file], 0);
    if (validationError) {
      setNotification({ message: validationError, tone: "warning" });
      return;
    }
    try {
      setNotification({
        message: "Đang tối ưu ảnh phụ kiện…",
        tone: "warning",
      });
      const image = await optimizeImage(file);
      const nextImages = [...componentImages];
      nextImages[index] = image;
      updateComponentItems(componentItems, nextImages);
      setNotification({ message: "Đã thêm ảnh phụ kiện.", tone: "success" });
    } catch {
      setNotification({
        message:
          "Không xử lý được ảnh phụ kiện. Vui lòng thử ảnh JPG, PNG hoặc WebP khác.",
        tone: "error",
      });
    }
  }
  function field(
    key: keyof AdminProduct,
    label: string,
    options: {
      type?: string;
      required?: boolean;
      area?: boolean;
      values?: string[];
      max?: number;
    } = {},
  ) {
    if (options.values) {
      return (
        <div className="block text-xs leading-5 text-[#616371]">
          <span>
            {label}
            {options.required && <span className="text-[#80151c]"> *</span>}
          </span>
          <AdminSelect
            ariaLabel={label}
            value={String(p[key])}
            options={options.values.map((value) => ({ value, label: value }))}
            onChange={(value) => set(key, value)}
            className="mt-1.5"
          />
        </div>
      );
    }
    const props = {
      className: inputStyle,
      required: options.required,
      value: String(p[key]),
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) =>
        set(
          key,
          options.type === "number" ? Number(e.target.value) : e.target.value,
        ),
    };
    return (
      <label className="block text-xs leading-5 text-[#616371]">
        {label}
        {options.required && <span className="text-[#80151c]"> *</span>}
        {options.area ? (
          <textarea {...props} rows={3} maxLength={options.max} />
        ) : (
          <input
            {...props}
            type={options.type || "text"}
            min={options.type === "number" ? 0 : undefined}
            max={options.max}
            step={key === "rating" ? "0.1" : undefined}
          />
        )}
      </label>
    );
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    const validationError = imageSelectionError(selected, p.images.length);
    if (validationError) {
      setNotification({ message: validationError, tone: "warning" });
      return;
    }
    try {
      setNotification({
        message: "Đang tối ưu ảnh để tải lên…",
        tone: "warning",
      });
      const images = await Promise.all(selected.map(optimizeImage));
      setP((old) => ({ ...old, images: [...old.images, ...images] }));
      setNotification({
        message: `Đã thêm ${images.length} ảnh thành công.`,
        tone: "success",
      });
    } catch {
      setNotification({
        message:
          "Không xử lý được ảnh này. Vui lòng thử ảnh JPG, PNG hoặc WebP khác.",
        tone: "error",
      });
    }
  }
  async function submit(draft = false) {
    if (saving) return;
    if (p.minHeight > p.maxHeight || p.minWeight > p.maxWeight) {
      setNotification({
        message: "Kích thước tối thiểu không được lớn hơn tối đa.",
        tone: "warning",
      });
      return;
    }
    const slug =
      p.slug ||
      p.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setNotification({
        message:
          "Không thể tự tạo đường dẫn từ tên trang phục. Vui lòng kiểm tra lại tên.",
        tone: "warning",
      });
      return;
    }
    if (!p.images.length) {
      setNotification({
        message: "Vui lòng thêm ít nhất một ảnh trang phục.",
        tone: "warning",
      });
      return;
    }
    const normalizedComponents = normalizeProductComponents(
      componentItems,
      componentImages,
    );
    const updated = {
      ...p,
      ...normalizedComponents,
      slug,
      tags: p.category,
      published: draft ? false : p.published,
    };
    setSaving(true);
    const savedProduct = await save(updated, draft);
    setSaving(false);
    if (savedProduct) {
      setP(savedProduct);
      setSaved(JSON.stringify(savedProduct));
      setComponentItems(parseProductComponents(savedProduct.components));
      setComponentImages(savedProduct.componentImages);
      if (draft) {
        setNotification({
          message: "Đã lưu bản nháp trên trình duyệt.",
          tone: "success",
        });
      } else {
        back();
      }
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <ToastViewport
        items={
          notification ? [{ id: "editor-notification", ...notification }] : []
        }
        onDismiss={() => setNotification(null)}
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={requestBack}
          className={`${buttonStyle} self-start`}
        >
          Quay lại danh sách
        </button>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            onClick={(e) => {
              if (e.currentTarget.form?.checkValidity()) {
                e.preventDefault();
                void submit(true);
              }
            }}
            className={buttonStyle}
          >
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={() => preview.current?.showModal()}
            className={buttonStyle}
          >
            Xem trước
          </button>
          <button disabled={saving} className={`${primaryStyle} col-span-2`}>
            {saving ? "Đang lưu…" : "✓ Lưu thay đổi"}
          </button>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Section title="Hình ảnh trang phục">
          <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-xl border border-[#eee5e1] bg-[#f7f2ee] sm:min-h-[520px]">
            {p.images[0] ? (
              <Image
                unoptimized
                width={900}
                height={1125}
                src={p.images[0]}
                alt="Ảnh đại diện trang phục"
                className="h-[430px] w-full object-contain object-center sm:h-[520px]"
              />
            ) : (
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                aria-label="Chọn ảnh đại diện"
                className="flex flex-col items-center gap-3 rounded-lg p-6 text-center text-sm text-[#737784] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#80151c]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl text-[#80151c]">
                  ＋
                </span>
                <span>Thêm ảnh để xem ảnh đại diện</span>
              </button>
            )}
            {p.images[0] && (
              <span className="absolute bottom-4 left-4 rounded-md bg-white/95 px-4 py-2 text-xs font-medium text-[#80151c] shadow-sm">
                Ảnh đại diện
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {p.images.map((src, i) => (
              <div
                key={`${i}-${src.slice(0, 30)}`}
                className="group relative aspect-square min-w-0"
              >
                <button
                  type="button"
                  aria-label={`Dùng ảnh ${i + 1} làm đại diện`}
                  onClick={() =>
                    set("images", [
                      src,
                      ...p.images.filter((_, index) => index !== i),
                    ])
                  }
                  className={`h-full w-full overflow-hidden rounded-lg border-2 bg-[#f7f2ee] transition ${i === 0 ? "border-[#80151c] shadow-sm" : "border-[#e6dedb] hover:border-[#b87579]"}`}
                >
                  <Image
                    unoptimized
                    width={240}
                    height={240}
                    src={src}
                    alt={`Trang phục ${i + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      p.images.filter((_, index) => index !== i),
                    )
                  }
                  aria-label={`Xóa ảnh ${i + 1}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#ead7d2] bg-white text-base leading-none text-[#80151c] shadow-sm transition hover:bg-[#80151c] hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {p.images.length < 8 && (
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#c9bec0] bg-white text-xs text-[#737784] transition hover:border-[#80151c] hover:bg-[#fff8f6] hover:text-[#80151c]">
                <span className="mb-1 text-2xl leading-none text-[#80151c]">
                  ＋
                </span>
                Thêm ảnh
                <input
                  ref={imageInput}
                  aria-label="Thêm ảnh trang phục"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={(e) => {
                    void upload(e.target.files);
                    e.target.value = "";
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            )}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#737784]">
            Chọn ảnh thu nhỏ bên dưới để đặt làm ảnh đại diện. Tối đa 8 ảnh JPG,
            PNG hoặc WebP; ảnh dưới 15 MB sẽ được tự động tối ưu.
          </p>
        </Section>
        <Section title="Thông tin cơ bản">
          <div className="grid gap-3 sm:grid-cols-2">
            {field("code", "Mã trang phục", { required: true })}
            {field("name", "Tên trang phục", { required: true })}
            {field("category", "Danh mục", { values: categories })}
            <div className="text-xs leading-5 text-[#616371]">
              Trạng thái
              <p className="mt-1.5 rounded-md bg-[#faf5f3] px-3 py-3 font-medium text-[#80151c]">
                {p.status}
              </p>
            </div>
            <div className="sm:col-span-2">
              {field("description", "Mô tả ngắn", {
                area: true,
                required: true,
                max: 300,
              })}
              <p className="text-right text-xs text-[#737784]">
                {p.description.length}/300
              </p>
            </div>
            {field("gender", "Giới tính", { values: ["Nữ", "Nam", "Unisex"] })}
            {field("badge", "Nhãn trên ảnh", { values: [...badges] })}
          </div>
          <div className="mt-6 border-t border-[#ebe2df] pt-5">
            <h3 className="mb-3 text-base font-semibold text-[#80151c]">
              Trọn bộ trang phục gồm
            </h3>
            <div ref={componentList} className="space-y-3">
              {componentItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#d9ced0] bg-[#fdfafa] px-4 py-5 text-center text-sm leading-6 text-[#737784]">
                  Chưa có phụ kiện hoặc thành phần nào trong bộ.
                </p>
              ) : (
                componentItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-[#ebe2df] bg-[#fdfbfa] p-3"
                  >
                    <label
                      title="Tải hoặc thay ảnh phụ kiện"
                      className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-[#c9bec0] bg-white text-[#80151c] transition hover:border-[#80151c] hover:bg-[#fff8f6]"
                    >
                      {componentImages[index] ? (
                        <Image
                          unoptimized
                          fill
                          sizes="64px"
                          src={componentImages[index]}
                          alt=""
                          className="object-cover"
                        />
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6"
                        >
                          <path d="M12 16V4m0 0L8 8m4-4 4 4M5 15v4h14v-4" />
                        </svg>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.jpg,.jpeg,.png,.webp"
                        aria-label={`Tải ảnh phụ kiện ${index + 1}`}
                        onChange={(event) => {
                          void uploadComponentImage(
                            index,
                            event.target.files?.[0],
                          );
                          event.target.value = "";
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">
                        Phụ kiện hoặc thành phần {index + 1}
                      </span>
                      <input
                        value={item}
                        onChange={(event) => {
                          const next = [...componentItems];
                          next[index] = event.target.value;
                          updateComponentItems(next);
                        }}
                        className={`${inputStyle} !mt-0`}
                        placeholder="Ví dụ: Mũ phượng"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateComponentItems(
                          componentItems.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                          componentImages.filter(
                            (_, imageIndex) => imageIndex !== index,
                          ),
                        )
                      }
                      aria-label={`Xóa phụ kiện hoặc thành phần ${index + 1}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#ead7d2] bg-white text-xl leading-none text-[#80151c] transition hover:border-[#80151c] hover:bg-[#fff3f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c]"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={addComponentItem}
              className={`${buttonStyle} mt-4 w-full border-dashed text-[#80151c]`}
            >
              ＋ Thêm phụ kiện đi kèm
            </button>
          </div>
        </Section>
        <Section title="Giá thuê & đặt cọc">
          <div className="grid gap-3 sm:grid-cols-3">
            {field("price", "Giá thuê / 24h (đ)", {
              type: "number",
              required: true,
            })}
            {field("extraDay", "Phụ thu / ngày tiếp (đ)", { type: "number" })}
            {field("deposit", "Tiền đặt cọc (đ)", {
              type: "number",
              required: true,
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {field("accessoryFee", "Phí phụ kiện (đ)", { type: "number" })}
            {field("offer", "Ưu đãi / ghi chú")}
          </div>
        </Section>
        <Section title="Thông số kỹ thuật & kích thước">
          <div className="grid grid-cols-2 gap-3">
            {field("minHeight", "Chiều cao từ (cm)", {
              type: "number",
              required: true,
            })}
            {field("maxHeight", "Chiều cao đến (cm)", {
              type: "number",
              required: true,
            })}
            {field("minWeight", "Cân nặng từ (kg)", {
              type: "number",
              required: true,
            })}
            {field("maxWeight", "Cân nặng đến (kg)", {
              type: "number",
              required: true,
            })}
            {field("material", "Chất liệu")}
            {field("accessories", "Phụ kiện đi kèm")}
          </div>
          <div className="mt-3">
            {field("fitNote", "Ghi chú điều chỉnh kích thước")}
          </div>
        </Section>
      </div>
      <div className="mt-4">
        <Section title="Lịch thuê">
          <ProductRentalCalendar productCode={initial.code} />
        </Section>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Nội dung chi tiết & bộ sưu tập">
          {field("details", "Mô tả chi tiết", { area: true })}
          <div className="mt-3">
            {field("collection", "Bộ sưu tập đề xuất")}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {field("rentalCount", "Lượt thuê", { type: "number" })}
            {field("likes", "Lượt yêu thích", { type: "number" })}
            {field("rating", "Điểm đánh giá (0–5)", { type: "number", max: 5 })}
            {field("reviewCount", "Số lượt đánh giá", { type: "number" })}
          </div>
        </Section>
        <Section title="Chính sách & hướng dẫn bảo quản">
          <div className="space-y-3">
            {field("cleaning", "Quy trình giặt hấp / bảo quản", { area: true })}
            {field("rentalPolicy", "Thời gian thuê, gia hạn & trả đồ", {
              area: true,
            })}
            {field("damagePolicy", "Bồi hoàn & trách nhiệm", { area: true })}
          </div>
        </Section>
      </div>
      <div className="mt-5 flex justify-end border-t border-[#e5e1df] pt-4">
        <button disabled={saving} className={primaryStyle}>
          {saving ? "Đang lưu…" : "✓ Lưu thay đổi"}
        </button>
      </div>
      <dialog
        aria-label="Xem trước nội dung trang phục"
        ref={preview}
        className="max-h-[90vh] w-[900px] max-w-[95vw] overflow-auto rounded-lg bg-[#fff8f5] p-6 text-[#563b36] backdrop:bg-black/40"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Xem trước nội dung trang phục
          </h2>
          <button
            type="button"
            className={buttonStyle}
            onClick={() => preview.current?.close()}
          >
            Đóng
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {p.images[0] && (
            <Image
              unoptimized
              width={640}
              height={800}
              src={p.images[0]}
              alt={p.name}
              className="max-h-[500px] w-full rounded object-cover"
            />
          )}
          <div>
            <p className="text-sm">
              {p.code} · {p.category}
            </p>
            <h3 className="mt-3 text-2xl font-bold text-[#80151c]">{p.name}</h3>
            <p className="my-5 text-2xl font-semibold text-[#80151c]">
              {money(p.price)}{" "}
              <span className="text-sm font-normal">/ 24 giờ</span>
            </p>
            <p className="text-sm leading-7">
              Đặt cọc: {money(p.deposit)}
              <br />
              Ngày tiếp theo: {money(p.extraDay)}
              <br />
              Chiều cao: {p.minHeight}–{p.maxHeight} cm
              <br />
              Cân nặng: {p.minWeight}–{p.maxWeight} kg
              <br />
              Chất liệu: {p.material}
              <br />
              Phụ kiện: {p.accessories}
            </p>
            <p className="mt-5 leading-7">{p.description}</p>
            <p className="mt-4 whitespace-pre-line text-sm leading-7">
              {p.components}
            </p>
          </div>
        </div>
        <p className="mt-5 whitespace-pre-line leading-7">{p.details}</p>
      </dialog>
      <ConfirmDialog
        open={leaveOpen}
        title="Rời trang chỉnh sửa?"
        description="Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn rời khỏi trang này?"
        confirmLabel="Rời trang"
        cancelLabel="Tiếp tục chỉnh sửa"
        tone="primary"
        onConfirm={confirmLeave}
        onCancel={() => {
          leaveAction.current = null;
          setLeaveOpen(false);
        }}
      />
    </form>
  );
}
