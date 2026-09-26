import { uploadResponse } from "@/lib/upload-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  return uploadResponse((await params).filename);
}
