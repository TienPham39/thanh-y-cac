let backendOrigin: Promise<string> | undefined;

async function getBackendOrigin() {
  if (process.env.NEXT_PUBLIC_STATIC_SITE !== "true") return "";
  backendOrigin ??= fetch("/deployment.json", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Không tải được cấu hình backend.");
      const config = await response.json();
      if (config.apiOrigin === "") return "";
      const url = new URL(config.apiOrigin);
      if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password)
        throw new Error("Địa chỉ backend phải là origin HTTPS.");
      return url.origin;
    })
    .catch(() => {
      backendOrigin = undefined;
      throw new Error("Cấu hình backend trong deployment.json không hợp lệ.");
    });
  return backendOrigin;
}

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${await getBackendOrigin()}${path}`, init);
}
