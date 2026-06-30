import { NextRequest, NextResponse } from "next/server";
import { getAudioFile, downloadAudioFromGCS } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");
  const id = searchParams.get("id");

  try {
    let buffer: Buffer;
    let mimeType: string;

    if (path) {
      // New: GCS-backed audio
      const result = await downloadAudioFromGCS(path);
      if (!result) {
        return NextResponse.json({ error: "Audio not found" }, { status: 404 });
      }
      buffer = result.buffer;
      mimeType = result.mimeType;
    } else if (id) {
      // Legacy: Firestore audio_files collection
      const audio = await getAudioFile(id);
      if (!audio) {
        return NextResponse.json({ error: "Audio not found" }, { status: 404 });
      }
      const raw = audio.data.includes(",") ? audio.data.split(",")[1] : audio.data;
      buffer = Buffer.from(raw, "base64");
      mimeType = audio.mimeType || "audio/webm";
    } else {
      return NextResponse.json({ error: "path or id required" }, { status: 400 });
    }

    const total = buffer.length;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
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

    return new Response(buffer as unknown as BodyInit, {
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
