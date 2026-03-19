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
    const res = await fetch(`${targetBase}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.status) {
      return NextResponse.json(data, { status: res.status || 400 });
    }

    const token = `${body.email || "admin"}-${Date.now()}`;
    const response = NextResponse.json({ status: true });
    response.cookies.set("admin_token", token, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    response.cookies.set("admin_email", body.email || "", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
