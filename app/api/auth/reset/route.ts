import { NextRequest, NextResponse } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const normalizeBase = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
};

const targetBase = normalizeBase(backendBase).replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${targetBase}/api/auth/admin-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message || "Reset failed" }, { status: 500 });
  }
}
