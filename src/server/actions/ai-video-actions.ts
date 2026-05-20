"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function submitVideoForAnalysis(videoUrl: string) {
  const session = await getSession();
  return prisma.videoAnalysis.create({
    data: {
      videoUrl,
      userId: session?.user?.id || null,
      status: "PENDING",
    },
  });
}

export async function getVideoAnalysis(id: string) {
  return prisma.videoAnalysis.findUnique({ where: { id } });
}

export async function getVideoAnalyses(limit: number = 20) {
  return prisma.videoAnalysis.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
