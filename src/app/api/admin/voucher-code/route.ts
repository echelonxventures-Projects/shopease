import { NextResponse } from "next/server";
import { getSession, isAdminRole } from "@/lib/auth";
import { generateSecureCode } from "@/lib/encryption";

export async function GET() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ code: generateSecureCode("VOU", 20) });
}
