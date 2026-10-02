export async function saveRequest(
  url: string,
  options: RequestInit,
  timeoutMessage: string,
  timeoutMs = 45_000,
  fetcher: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    const body = await response.json().catch(() => {
      throw new Error(`Máy chủ trả phản hồi không hợp lệ (HTTP ${response.status}). Vui lòng thử lại sau.`);
    });
    if (!response.ok) throw new Error(body?.error?.message || `Chưa lưu được dữ liệu (HTTP ${response.status}).`);
    return body;
  } catch (cause) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw cause;
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadProductImages(
  images: string[],
  componentImages: string[],
  cache: Map<string, string>,
  upload: (image: string) => Promise<string>,
  progress: (done: number, total: number) => void,
) {
  const pending = [...new Set([...images, ...componentImages])]
    .filter(image => image.startsWith("data:image/") && !cache.has(image));
  let cursor = 0, completed = 0;
  progress(0, pending.length);
  async function worker() {
    while (cursor < pending.length) {
      const image = pending[cursor++];
      cache.set(image, await upload(image));
      progress(++completed, pending.length);
    }
  }
  // Avoid saturating shared PHP hosting, and wait for both workers before allowing retry.
  const results = await Promise.allSettled(Array.from({ length: Math.min(2, pending.length) }, worker));
  const failed = results.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
  const stored = (image: string) => cache.get(image) ?? image;
  return { images: images.map(stored), componentImages: componentImages.map(stored) };
}
