import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 500);
  const rows = await prisma.faultEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ faults: rows });
}
