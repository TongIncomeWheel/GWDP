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

    return new Response(new Blob([buffer], { type: mimeType }), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[AUDIO STREAM]", e);
    return NextResponse.json({ error: "Failed to load audio" }, { status: 500 });
  }
}
