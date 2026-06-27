import { NextRequest, NextResponse } from "next/server";
import { clearRecordings } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  clearRecordings(Number(id));
  return NextResponse.json({ ok: true });
}
