import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GensetConfig } from "@/lib/genset/types";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 200);
  const rows = await prisma.configSnapshot.findMany({
    orderBy: { savedAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ configs: rows });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GensetConfig;
  const row = await prisma.configSnapshot.create({
    data: {
      generatorName: body.generator_name ? String(body.generator_name) : null,
      config: body as object,
    },
  });
  return NextResponse.json({ id: row.id });
}
