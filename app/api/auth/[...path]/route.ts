import { NextRequest, NextResponse } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const targetBase = `${backendBase.replace(/\/$/, "")}/api/auth`;

async function proxy(req: NextRequest, params: { path?: string[] }) {
  const joined = (params.path || []).join("/");
  const url = `${targetBase}/${joined}`;
  const init: RequestInit = {
    method: req.method,
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(
        ([key]) => !["host", "content-length"].includes(key.toLowerCase())
      )
    ),
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: `Auth upstream unreachable: ${error.message}` },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}
