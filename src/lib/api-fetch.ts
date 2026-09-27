// Frontend and PHP API share an origin in production; Next dev proxies /api to PHP.
export async function apiFetch(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error("Không kết nối được dịch vụ dữ liệu. Vui lòng thử lại sau.");
  }
  return response;
}
