import { readFile } from "node:fs/promises";
import path from "node:path";

export async function uploadResponse(filename: string, directory = path.join(process.cwd(), "public", "uploads")) {
  const match = /^[a-f0-9-]{36}\.(jpg|png|webp)$/.exec(filename);
  if (!match) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(directory, filename));
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": `image/${match[1] === "jpg" ? "jpeg" : match[1]}`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    throw error;
  }
}
