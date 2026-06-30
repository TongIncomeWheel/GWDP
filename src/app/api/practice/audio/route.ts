import { NextRequest, NextResponse } from "next/server";
import { uploadAudioToGCS } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error: "data required" }, { status: 400 });
    const path = await uploadAudioToGCS(data);
    if (!path) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    return NextResponse.json({ path });
  } catch (e) {
    console.error("[AUDIO UPLOAD]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
