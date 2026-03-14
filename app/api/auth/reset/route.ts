import { NextRequest, NextResponse } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${backendBase.replace(/\/$/, "")}/api/auth/admin-reset`, {
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
