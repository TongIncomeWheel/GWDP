import { NextRequest, NextResponse } from "next/server";
import { getAudioFile } from "@/lib/db";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const audio = await getAudioFile(id);
  if (!audio) {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }

  // Decode base64 data URL back to raw bytes
  const raw = audio.data.includes(",") ? audio.data.split(",")[1] : audio.data;
  const buffer = Buffer.from(raw, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": audio.mimeType || "audio/webm",
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=86400",
      "Accept-Ranges": "bytes",
    },
  });
}
