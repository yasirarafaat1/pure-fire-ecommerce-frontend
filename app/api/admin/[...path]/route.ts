import { NextRequest } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const targetBase = backendBase.replace(/\/$/, "").endsWith("/admin")
  ? backendBase.replace(/\/$/, "")
  : `${backendBase.replace(/\/$/, "")}/admin`;

async function proxy(req: NextRequest, params: { path?: string[] }) {
  const joined = (params.path || []).join("/");
  const search = req.nextUrl.search || "";
  const url = `${targetBase}/${joined}${search}`;

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(
        ([key]) => !["host", "content-length"].includes(key.toLowerCase())
      )
    ),
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;`n    init.duplex = "half";
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: false,
        message: `Upstream ${url} unreachable: ${err.message}`,
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  const resolved = await Promise.resolve(params);
  return proxy(req, resolved);
}

