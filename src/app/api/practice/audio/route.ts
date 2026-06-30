import { NextRequest, NextResponse } from "next/server";
import { uploadAudio } from "@/lib/audio-service";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error: "data required" }, { status: 400 });
    const path = await uploadAudio(data);
    return NextResponse.json({ path });
  } catch (e) {
    console.error("[AUDIO UPLOAD]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
