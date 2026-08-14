import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GensetData } from "@/lib/genset/types";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 200), 1000);
  const rows = await prisma.telemetry.findMany({
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ telemetry: rows });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GensetData;

  const last = await prisma.telemetry.findFirst({ orderBy: { recordedAt: "desc" } });
  const faultLatched = !!body.fault_latched;

  const row = await prisma.telemetry.create({
    data: {
      voltage: numOrNull(body.voltage),
      current: numOrNull(body.current),
      frequency: numOrNull(body.frequency),
      powerFactor: numOrNull(body.power_factor),
      outputPower: numOrNull(body.output_power),
      temperature: numOrNull(body.temperature),
      vibration: numOrNull(body.vibration),
      tilt: numOrNull(body.tilt),
      oilLevel: numOrNull(body.oil_level),
      faultLatched,
      tripCause: strOrNull(body.trip_cause),
      message: strOrNull(body.message),
      raw: body as object,
    },
  });

  if (faultLatched && !last?.faultLatched) {
    await prisma.faultEvent.create({
      data: {
        tripCause: strOrNull(body.trip_cause),
        message: strOrNull(body.message),
        raw: body as object,
      },
    });
  }

  return NextResponse.json({ id: row.id });
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(v: unknown): string | null {
  return v === null || v === undefined || v === "" ? null : String(v);
}
