import { NextRequest, NextResponse } from "next/server";
import { getAudioFile } from "@/lib/db";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const audio = await getAudioFile(id);
    if (!audio) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    // Strip data URL prefix and decode base64 to binary
    const raw = audio.data.includes(",") ? audio.data.split(",")[1] : audio.data;
    const buffer = Buffer.from(raw, "base64");
    const mimeType = audio.mimeType || "audio/webm";
    const total = buffer.length;

    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      // Parse "bytes=start-end"
      const [, rangeVal] = rangeHeader.split("=");
      const [startStr, endStr] = (rangeVal ?? "").split("-");
      const start = parseInt(startStr || "0", 10);
      const end = endStr ? parseInt(endStr, 10) : total - 1;
      const chunkLength = end - start + 1;

      return new Response(buffer.slice(start, end + 1), {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(chunkLength),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[AUDIO STREAM]", e);
    return NextResponse.json({ error: "Failed to load audio" }, { status: 500 });
  }
}
