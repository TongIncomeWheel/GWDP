import { NextRequest, NextResponse } from "next/server";
import { deleteZhRecordings } from "@/lib/zh-db";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await deleteZhRecordings(Number(id));
  return NextResponse.json({ ok: true });
}
