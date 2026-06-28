import { NextRequest, NextResponse } from "next/server";
import { uploadAudioToStorage } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { data, mimeType } = await req.json();
    if (!data) return NextResponse.json({ error: "data required" }, { status: 400 });
    const url = await uploadAudioToStorage(data, mimeType || "audio/webm");
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[AUDIO UPLOAD ERROR]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
