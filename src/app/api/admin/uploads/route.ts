import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { isSameOriginRequest } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formats = {
  jpeg: { extension: "jpg", valid: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  png: { extension: "png", valid: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  webp: { extension: "webp", valid: (bytes: Buffer) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" },
} as const;

async function authorized(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return Boolean(secret && token && await verifySessionToken(token, secret));
}

function error(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  if (!await authorized(request)) return error("UNAUTHORIZED", "Vui lòng đăng nhập lại.", 401);
  if (!isSameOriginRequest(request.url, request.headers))
    return error("INVALID_ORIGIN", "Địa chỉ gửi yêu cầu không khớp với website. Hãy tải lại trang rồi thử lại.", 403);

  let image: string;
  try {
    const body = await request.text();
    if (body.length > 1_500_000) return error("IMAGE_TOO_LARGE", "Ảnh tải lên quá lớn.", 413);
    const parsed = JSON.parse(body) as { image?: unknown };
    if (typeof parsed.image !== "string") throw new Error("Invalid image");
    image = parsed.image;
  } catch {
    return error("INVALID_IMAGE", "Dữ liệu ảnh không hợp lệ.", 400);
  }

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match) return error("INVALID_IMAGE", "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.", 422);
  const format = formats[match[1] as keyof typeof formats];
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 750_000 || !format.valid(bytes))
    return error("INVALID_IMAGE", "Ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.", 422);

  try {
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${format.extension}`;
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
    return Response.json({ data: { url: `/uploads/${filename}` } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Admin image upload failed", cause);
    return error("UPLOAD_FAILED", "Chưa lưu được ảnh lên máy chủ. Vui lòng thử lại.", 500);
  }
}
