export const MAX_PRODUCT_IMAGES = 5;
export const MAX_SOURCE_IMAGE_BYTES = 15_000_000;
export const TARGET_IMAGE_BYTES = 350_000;
export const MAX_IMAGE_EDGE = 1_600;

const supportedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const supportedExtension = /\.(?:jpe?g|png|webp)$/i;

export type ImageFileInfo = Pick<File, "name" | "size" | "type">;

export function imageSelectionError(files: ImageFileInfo[], existingCount: number) {
  if (existingCount + files.length > MAX_PRODUCT_IMAGES) {
    return `Mỗi trang phục chỉ được dùng tối đa ${MAX_PRODUCT_IMAGES} ảnh.`;
  }

  const unsupported = files.find(file =>
    file.type ? !supportedTypes.has(file.type.toLowerCase()) : !supportedExtension.test(file.name),
  );
  if (unsupported) {
    return `Ảnh “${unsupported.name}” không đúng định dạng. Vui lòng chọn JPG, PNG hoặc WebP.`;
  }

  const oversized = files.find(file => file.size > MAX_SOURCE_IMAGE_BYTES);
  if (oversized) {
    return `Ảnh “${oversized.name}” lớn hơn 15 MB. Vui lòng chọn ảnh có dung lượng nhỏ hơn.`;
  }

  return "";
}
