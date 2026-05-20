import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Read from SystemConfig DB
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["deep_link_android_package", "deep_link_android_sha256"] },
    },
  });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;

  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: map["deep_link_android_package"] || "com.shopease.app",
        sha256_cert_fingerprints: [map["deep_link_android_sha256"] || "SHA256_FINGERPRINT_HERE"],
      },
    },
  ]);
}
