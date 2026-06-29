import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "@/lib/db";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  // Prevent path traversal
  const safe = decodeURIComponent(path).replace(/\.\./g, "").replace(/^\/+/, "");

  const file = getBucket().file(safe);

  try {
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || "audio/webm";

    const [buffer] = await file.download();
    const arrayBuffer: ArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=86400",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (e) {
    console.error("[AUDIO STREAM ERROR]", e);
    return NextResponse.json({ error: "Failed to stream audio" }, { status: 500 });
  }
}
