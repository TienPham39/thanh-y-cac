"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { imageUploadForm, saveRequest, uploadProductImages } from "@/lib/admin-product-save";
import {
  AdminProduct,
  blankProduct,
  nextProductCode,
  money,
  sampleProducts,
  statuses,
  storageKey,
} from "@/lib/admin-products";
import { mergeAdminCatalog, type AdminCatalogRow } from "@/lib/admin-catalog";
import AdminShell, {
  buttonStyle,
  inputStyle,
  primaryStyle,
} from "./admin-shell";
import ProductEditor from "./product-editor";
import AdminSelect from "./admin-select";
import ConfirmDialog from "./confirm-dialog";
import ToastViewport, { type ToastItem } from "./toast";
import { Icon } from "../icon";
import { paginationItems } from "@/lib/admin-pagination";
import type { AdminCategory } from "@/lib/admin-categories";

function newProduct(rows: AdminProduct[], options: AdminCategory[]) {
  const product = blankProduct(rows);
  if (options.length) {
    product.category = options[0].name;
    product.code = nextProductCode(product.category, rows, Object.fromEntries(options.map(row => [row.name, row.codePrefix || ""])));
  }
  return product;
}

function productPayload(product: AdminProduct, published = product.published) {
  return {
    code: product.code,
    slug: product.slug,
    name: product.name,
    description: product.description,
    image: product.images[0] || "",
    images: product.images,
    components: product.components,
    componentImages: product.componentImages,
    popularity: product.rentalCount,
    likes: product.likes,
    rating: product.rating,
    reviewCount: product.reviewCount,
    price: product.price,
    extraDay: product.extraDay,
    deposit: product.deposit,
    accessoryFee: product.accessoryFee,
    category: product.category,
    gender: product.gender,
    status: product.status,
    tags: product.tags,
    accessories: product.accessories,
    badge: product.badge,
    minHeight: product.minHeight,
    maxHeight: product.maxHeight,
    minWeight: product.minWeight,
    maxWeight: product.maxWeight,
    published,
  };
}

async function uploadImage(image: string) {
  if (!image.startsWith("data:image/")) return image;
  const body = await saveRequest("/api/admin/uploads", {
    method: "POST",
    body: imageUploadForm(image),
  }, "Tải ảnh quá thời gian chờ. Ảnh đã tải thành công sẽ được giữ lại khi bạn thử lưu lại.");
  if (typeof body.data?.url !== "string")
    throw new Error(body.error?.message || "Chưa tải được ảnh lên máy chủ.");
  return body.data.url as string;
}

export default function AdminProducts({
  editor = false,
}: {
  editor?: boolean;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categoryRows, setCategoryRows] = useState<AdminCategory[]>([]);
  const categories = categoryRows.map(row => row.name);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selected, setSelected] = useState<string[]>([]);
  const [publicationReady, setPublicationReady] = useState(false);
  const [publicationError, setPublicationError] = useState("");
  const [publicationMessage, setPublicationMessage] = useState("");
  const [publishingCode, setPublishingCode] = useState("");
  const [publicationRetry, setPublicationRetry] = useState(0);
  const [serverCodes, setServerCodes] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const uploadedImages = useRef(new Map<string, string>());
  useEffect(() => {
    const abort = new AbortController();
    let drafts = sampleProducts();
    setLoaded(false);
    setPublicationReady(false);
    setPublicationError("");
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          !Array.isArray(parsed) ||
          parsed.some(
            (row) =>
              !row ||
              typeof row.id !== "string" ||
              typeof row.name !== "string" ||
              !Array.isArray(row.images),
          )
        )
          throw Error("Invalid drafts");
        drafts = parsed.map((row) => ({ ...blankProduct(), ...row }));
      }
    } catch {
      setStorageError(true);
      setError(
        "Không đọc được bản nháp đã lưu. Đã khóa thao tác lưu để bảo vệ dữ liệu cũ. Vui lòng dùng trình duyệt khác để xem thử giao diện.",
      );
    }
    function showRows(rows: AdminProduct[], options: AdminCategory[] = []) {
      setProducts(rows);
      if (editor) {
        const id = new URLSearchParams(window.location.search).get("id");
        if (id === "new" && options.length) setEditing(newProduct(rows, options));
        else {
          const found = rows.find((row) => row.id === id || row.slug === id);
          if (id && !found)
            setError("Không tìm thấy trang phục. Hãy chọn lại từ danh sách.");
          setEditing(found || (!id ? rows[0] : null) || null);
        }
      }
      setLoaded(true);
    }
    fetch("/api/admin/products", { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.error?.message ||
              "Chưa tải được danh sách trang phục từ website.",
          );
        const catalog = body.data as AdminCatalogRow[];
        const categoryResponse = await fetch("/api/admin/categories", { cache: "no-store", signal: abort.signal });
        const categoryBody = await categoryResponse.json();
        if (!categoryResponse.ok) throw new Error(categoryBody.error?.message || "Không tải được danh mục.");
        const options = categoryBody.data as AdminCategory[];
        setCategoryRows(options);
        setServerCodes(catalog.map((row) => row.code));
        showRows(mergeAdminCatalog(catalog, drafts), options);
        setPublicationReady(true);
      })
      .catch((cause) => {
        if (!abort.signal.aborted) {
          setPublicationError(
            cause instanceof Error
              ? cause.message
              : "Chưa tải được danh sách trang phục từ website.",
          );
          showRows(mergeAdminCatalog([], drafts));
        }
      });
    return () => abort.abort();
  }, [editor, publicationRetry]);
  function persistProduct(product: AdminProduct, rows: AdminProduct[]) {
    if (storageError) return false;
    try {
      const saved: AdminProduct[] = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      if (!Array.isArray(saved)) throw Error("Invalid drafts");
      const next = saved.filter(
        (row) => row.id !== product.id && row.code !== product.code,
      );
      localStorage.setItem(storageKey, JSON.stringify([...next, product]));
      setProducts(rows);
      setError("");
      return true;
    } catch {
      setError(
        "Không lưu được bản nháp. Bộ nhớ trình duyệt có thể đã đầy; hãy giảm số ảnh hoặc xuất dữ liệu để giữ thay đổi.",
      );
      return false;
    }
  }
  async function save(
    p: AdminProduct,
    draftOnly: boolean,
  ): Promise<AdminProduct | null> {
    if (
      products.some(
        (row) =>
          row.id !== p.id &&
          (row.code.toLowerCase() === p.code.toLowerCase() ||
            row.slug === p.slug),
      )
    ) {
      setError(
        "Mã trang phục hoặc đường dẫn đã tồn tại. Vui lòng dùng giá trị khác.",
      );
      return null;
    }
    const existing = products.find((row) => row.id === p.id);
    const published =
      existing &&
      existing.code === p.code &&
      serverCodes.includes(existing.code)
        ? existing.published
        : !draftOnly;
    setError("");
    try {
      // Browser drafts do not need to wait for hosting or upload their images.
      const storedImages = draftOnly ? { images: p.images, componentImages: p.componentImages }
        : await uploadProductImages(p.images, p.componentImages, uploadedImages.current, uploadImage,
          (done, total) => setSaveProgress(total ? `Đang tải ảnh ${done}/${total}…` : "Đang lưu thông tin…"));
      const savedProduct = { ...p, ...storedImages, published };
      if (!draftOnly) {
        setSaveProgress("Đang lưu thông tin…");
        await saveRequest("/api/admin/products", {
          method: serverCodes.includes(p.code) ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productPayload(savedProduct)),
        }, "Máy chủ phản hồi quá lâu. Hãy kiểm tra danh sách trang phục trước khi thử lưu lại để tránh tạo trùng.", 30_000);
        if (!serverCodes.includes(p.code))
          setServerCodes((current) => [...current, p.code]);
      }
      const persisted = persistProduct(
        savedProduct,
        serverCodes.includes(p.code) && existing
          ? products.map((row) => (row.id === p.id ? savedProduct : row))
          : [savedProduct, ...products.filter(row => row.id !== p.id)],
      );
      if (!persisted) return null;
      uploadedImages.current.clear();
      if (!serverCodes.includes(p.code)) {
        setPage(1); setQuery(""); setCategory(""); setStatus(""); setPrice("");
      }
      if (!draftOnly)
        setPublicationMessage(
          `Đã lưu thông tin trang phục ${savedProduct.code} thành công.`,
        );
      return savedProduct;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Chưa lưu được trang phục. Vui lòng thử lại.",
      );
      return null;
    } finally {
      setSaveProgress("");
    }
  }
  async function togglePublication(product: AdminProduct) {
    if (!publicationReady || publishingCode) return;
    setPublishingCode(product.code);
    setPublicationError("");
    setPublicationMessage("");
    try {
      const response = await fetch("/api/admin/products/publication", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productPayload(product, !product.published)),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message || "Chưa đổi được trạng thái mở bán.",
        );
      const rows = products.map((row) =>
        row.id === product.id
          ? { ...row, published: body.data.published }
          : row,
      );
      setProducts(rows);
      setPublicationMessage(
        `${body.data.published ? "Đã mở bán" : "Đã ẩn bán"} ${product.code} trên danh sách khách hàng.`,
      );
      if (!serverCodes.includes(product.code))
        setServerCodes((current) => [...current, product.code]);
    } catch (cause) {
      setPublicationError(
        cause instanceof Error
          ? cause.message
          : "Chưa đổi được trạng thái mở bán.",
      );
    } finally {
      setPublishingCode("");
    }
  }
  function remove(ids: string[]) {
    setPendingDeleteIds(ids);
  }
  async function confirmRemove() {
    const ids = pendingDeleteIds;
    if (!ids.length) return;
    const targets = products.filter((row) => ids.includes(row.id));
    const databaseCodes = targets
      .filter((row) => serverCodes.includes(row.code))
      .map((row) => row.code);
    setDeleting(true);
    setError("");
    try {
      if (databaseCodes.length) {
        const response = await fetch("/api/admin/products", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codes: databaseCodes }),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error?.message || "Chưa xóa được trang phục.");
      }
      const saved: AdminProduct[] = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      if (!Array.isArray(saved)) throw Error("Invalid drafts");
      const targetCodes = new Set(targets.map((row) => row.code));
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          saved.filter(
            (row) => !ids.includes(row.id) && !targetCodes.has(row.code),
          ),
        ),
      );
      setProducts((current) => current.filter((row) => !ids.includes(row.id)));
      setServerCodes((current) =>
        current.filter((code) => !targetCodes.has(code)),
      );
      setSelected([]);
      setPendingDeleteIds([]);
      setError("");
      setPublicationMessage(
        `Đã xóa ${targets.length} trang phục khỏi hệ thống.`,
      );
    } catch (cause) {
      setPendingDeleteIds([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Chưa xóa được trang phục. Vui lòng thử lại.",
      );
    } finally {
      setDeleting(false);
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "thanh-y-cac-trang-phuc.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filtered = products.filter(
    (p) =>
      `${p.name} ${p.code}`
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")) &&
      (!category || p.category === category) &&
      (!status || p.status === status) &&
      (!price ||
        (price === "low"
          ? p.price < 300000
          : price === "mid"
            ? p.price >= 300000 && p.price <= 500000
            : p.price > 500000)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pages = paginationItems(currentPage, totalPages);
  const headerTitle = editing
    ? products.some((product) => product.id === editing.id)
      ? "Chỉnh sửa trang phục"
      : "Thêm trang phục"
    : editor
      ? "Chỉnh sửa trang phục"
      : "Quản lý trang phục";
  const notifications: ToastItem[] = [
    ...(error
      ? [{ id: "admin-error", message: error, tone: "error" as const }]
      : []),
    ...(publicationError
      ? [
          {
            id: "publication-error",
            message: `${publicationError}${!publicationReady ? " Nút mở bán tạm thời chưa khả dụng." : ""}`,
            tone: "warning" as const,
            ...(!publicationReady
              ? {
                  action: {
                    label: "Thử lại",
                    onClick: () => setPublicationRetry((value) => value + 1),
                  },
                }
              : {}),
          },
        ]
      : []),
    ...(publicationMessage
      ? [
          {
            id: "publication-success",
            message: publicationMessage,
            tone: "success" as const,
          },
        ]
      : []),
  ];
  function dismissNotification(id: string) {
    if (id === "admin-error") setError("");
    if (id === "publication-error") setPublicationError("");
    if (id === "publication-success") setPublicationMessage("");
  }
  return (
    <AdminShell title={headerTitle} actions={!editing && !editor ? (<>
                <button onClick={exportData} className={buttonStyle}>
                  ↓ Xuất dữ liệu
                </button>
                <button
                  disabled={!categoryRows.length}
                  onClick={() => setEditing(newProduct(products, categoryRows))}
                  className={primaryStyle}
                >
                  ＋ Thêm trang phục
                </button>
              </>) : undefined}>
      <ToastViewport items={notifications} onDismiss={dismissNotification} />
      {!loaded ? (
        <p role="status" className="py-20 text-center">
          Đang tải trang phục...
        </p>
      ) : editing ? (
        <ProductEditor
          key={editing.id}
          initial={editing}
          categoryRows={categoryRows}
          existingProducts={products}
          save={save}
          saveProgress={saveProgress}
          back={() => {
            setEditing(null);
            if (editor)
              window.history.replaceState(null, "", "/admin/trang-phuc");
          }}
        />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {["Tổng trang phục", ...statuses.slice(0, 2)].map((label, i) => {
              const count = i
                ? products.filter((p) => p.status === statuses[i - 1]).length
                : products.length;
              return (
                <div
                  key={label}
                  className="flex items-start gap-5 rounded-lg border border-[#e7e6e9] bg-white p-5"
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${i === 1 ? "bg-green-50 text-green-800" : i === 2 ? "bg-orange-50 text-orange-800" : "bg-[#fbefef] text-[#80151c]"}`}
                  >
                    <Icon
                      name={
                        i === 2 ? "calendar" : i === 1 ? "shield" : "hanger"
                      }
                      className="!h-7 !w-7"
                    />
                  </span>
                  <div>
                    <p className="text-sm">{label}</p>
                    <strong className="mt-2 block text-3xl text-[#80151c]">
                      {count}
                    </strong>
                    <p className="mt-2 text-xs text-[#737784]">
                      {i
                        ? `${products.length ? Math.round((count / products.length) * 100) : 0}% tổng số`
                        : `${products.filter((product) => !serverCodes.includes(product.code)).length} bản nháp trên máy`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <section className="rounded-lg border border-[#e7e6e9] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <h2 className="text-xl font-bold text-[#80151c]">
                Danh sách trang phục
              </h2>

            </div>
            <div className="relative z-10 grid gap-3 border-t border-[#efedf0] px-5 py-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
              <label className="relative">
                <span className="sr-only">Tìm trang phục</span>
                <input
                  className={`${inputStyle} !mt-0 !min-h-11 !rounded-lg`}
                  placeholder="Tìm theo tên, mã trang phục..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <AdminSelect
                ariaLabel="Danh mục"
                value={category}
                options={[
                  { value: "", label: "Tất cả danh mục" },
                  ...categories.map((value) => ({ value, label: value })),
                ]}
                onChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              />
              <AdminSelect
                ariaLabel="Tình trạng"
                value={status}
                options={[
                  { value: "", label: "Tất cả tình trạng" },
                  ...statuses.map((value) => ({ value, label: value })),
                ]}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
              <AdminSelect
                ariaLabel="Giá thuê"
                value={price}
                options={[
                  { value: "", label: "Giá thuê: Mọi mức giá" },
                  { value: "low", label: "Dưới 300.000đ" },
                  { value: "mid", label: "300.000đ – 500.000đ" },
                  { value: "high", label: "Trên 500.000đ" },
                ]}
                onChange={(value) => {
                  setPrice(value);
                  setPage(1);
                }}
              />
            </div>
            {selected.length > 0 && (
              <div className="flex items-center gap-4 px-5 py-2 text-sm">
                <span>Đã chọn {selected.length} trang phục</span>
                <button
                  onClick={() => remove(selected)}
                  className="text-red-700 underline"
                >
                  Xóa mục đã chọn
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] border-collapse text-left text-xs">
                <thead className="border-y border-[#efedf0] bg-[#faf9f9]">
                  <tr>
                    <th className="p-3">
                      <input
                        type="checkbox"
                        aria-label="Chọn tất cả trên trang"
                        checked={
                          visible.length > 0 &&
                          visible.every((p) => selected.includes(p.id))
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [
                                  ...new Set([
                                    ...selected,
                                    ...visible.map((p) => p.id),
                                  ]),
                                ]
                              : selected.filter(
                                  (id) => !visible.some((p) => p.id === id),
                                ),
                          )
                        }
                        className="accent-[#80151c]"
                      />
                    </th>
                    {[
                      "Hình ảnh",
                      "Mã trang phục",
                      "Tên trang phục",
                      "Danh mục",
                      "Giá thuê / 24h",
                      "Đặt cọc",
                      "Tình trạng",
                      "Độ phổ biến",
                      "Thao tác",
                    ].map((label) => (
                      <th key={label} className="px-3 py-4 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#efedf0] hover:bg-[#fdfafa]"
                    >
                      <td className="p-3">
                        <input
                          aria-label={`Chọn ${p.code}`}
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, p.id]
                                : selected.filter((id) => id !== p.id),
                            )
                          }
                          className="accent-[#80151c]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Image
                          unoptimized
                          width={640}
                          height={800}
                          src={p.images[0] || "/images/logo2.png"}
                          alt={p.name}
                          className="h-[120px] w-24 rounded bg-[#faf7f5] object-contain"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3">{p.code}</td>
                      <td className="max-w-[190px] px-3 text-sm leading-6">
                        <button
                          onClick={() => setEditing(p)}
                          className="text-left hover:text-[#80151c]"
                        >
                          {p.name}
                        </button>
                        {!p.published && (
                          <span className="block text-[10px] text-[#737784]">
                            {serverCodes.includes(p.code)
                              ? "Đã ẩn"
                              : "Bản nháp · Ẩn"}
                          </span>
                        )}
                      </td>
                      <td className="px-3">
                        <span className="whitespace-nowrap rounded bg-[#fceeee] px-3 py-2 text-[#80151c]">
                          {p.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3">
                        {money(p.price)}
                      </td>
                      <td className="whitespace-nowrap px-3">
                        {p.deposit ? money(p.deposit) : "—"}
                      </td>
                      <td className="px-3">
                        <span
                          className={`whitespace-nowrap rounded px-2 py-2 ${p.status === statuses[0] ? "bg-green-50 text-green-800" : p.status === statuses[1] ? "bg-orange-50 text-orange-800" : "bg-red-50 text-red-800"}`}
                        >
                          ● &nbsp;{p.status}
                        </span>
                      </td>
                      <td className="px-3 text-center">{p.rentalCount}</td>
                      <td className="px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadbd5] bg-white text-[#526477] transition hover:border-[#80151c] hover:text-[#80151c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c]"
                            title="Chỉnh sửa"
                            aria-label={`Chỉnh sửa ${p.code}`}
                            onClick={() => setEditing(p)}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            type="button"
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#eadbd5] bg-white transition hover:border-[#80151c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80151c] disabled:cursor-not-allowed disabled:opacity-40 ${p.published ? "text-[#80151c]" : "text-[#526477]"}`}
                            title={p.published ? "Ẩn bán" : "Mở bán"}
                            aria-label={`${p.published ? "Ẩn bán" : "Mở bán"} ${p.code}`}
                            aria-pressed={p.published}
                            disabled={
                              !publicationReady || Boolean(publishingCode)
                            }
                            onClick={() => togglePublication(p)}
                          >
                            <Icon
                              name={p.published ? "pauseCircle" : "playCircle"}
                            />
                          </button>
                          <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#f0d8d2] bg-white text-[#b52222] transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b52222]"
                            title="Xóa"
                            aria-label={`Xóa ${p.code}`}
                            onClick={() => remove([p.id])}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible.length === 0 && (
              <p className="p-12 text-center text-sm text-[#737784]">
                Không tìm thấy trang phục phù hợp. Hãy đổi bộ lọc hoặc thêm
                trang phục mới.
              </p>
            )}
            <div className="flex flex-col gap-4 p-5 text-xs text-[#737784] lg:flex-row lg:items-center lg:justify-between">
              <span>
                Hiển thị {visible.length} trên {filtered.length} kết quả
              </span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <nav
                  aria-label="Phân trang"
                  className="flex flex-wrap items-center gap-2"
                >
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5d8d5] bg-white text-xl text-[#7d6e72] transition hover:border-[#80151c] hover:text-[#80151c] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Trang trước"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ‹
                  </button>
                  {pages.map((item, index) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="flex h-11 w-8 items-center justify-center"
                      >
                        <Image
                          src="/images/pagination-icon.png"
                          alt=""
                          width={10}
                          height={10}
                          aria-hidden="true"
                        />
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={item}
                        aria-label={`Trang ${item}`}
                        aria-current={item === currentPage ? "page" : undefined}
                        onClick={() => setPage(item)}
                        className={`flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${item === currentPage ? "border-[#80151c] bg-[#80151c] border !border-[#b8872e] text-white" : "border-[#e5d8d5] bg-white text-[#51474c] hover:border-[#80151c] hover:text-[#80151c]"}`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5d8d5] bg-white text-xl text-[#7d6e72] transition hover:border-[#80151c] hover:text-[#80151c] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Trang sau"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    ›
                  </button>
                </nav>
                <AdminSelect
                  ariaLabel="Số trang phục mỗi trang"
                  value={String(pageSize)}
                  options={[6, 12, 24].map((size) => ({
                    value: String(size),
                    label: `Hiển thị ${size} / trang`,
                  }))}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                  className="w-full sm:w-44"
                  placement="top"
                />
              </div>
            </div>
          </section>
        </>
      )}
      <ConfirmDialog
        open={pendingDeleteIds.length > 0}
        title="Xóa trang phục?"
        description={
          pendingDeleteIds.some((id) =>
            products.some(
              (row) => row.id === id && serverCodes.includes(row.code),
            ),
          )
            ? `Bạn sắp xóa ${pendingDeleteIds.length} trang phục khỏi hệ thống và danh sách khách hàng. Thao tác này không thể hoàn tác.`
            : `Bạn sắp xóa ${pendingDeleteIds.length} bản nháp khỏi trình duyệt này. Thao tác này không thể hoàn tác.`
        }
        confirmLabel="Xóa trang phục"
        busy={deleting}
        onConfirm={() => {
          void confirmRemove();
        }}
        onCancel={() => setPendingDeleteIds([])}
      />
    </AdminShell>
  );
}
