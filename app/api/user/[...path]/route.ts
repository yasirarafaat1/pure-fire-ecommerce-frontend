import { NextRequest } from "next/server";

const targetBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  const joined = path.join("/");
  const search = req.nextUrl.search || "";
  const url = `${targetBase}/user/${joined}${search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { ...Object.fromEntries(req.headers) },
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    redirect: "manual",
  };
  if (init.body) {
    // Required for Node fetch when streaming a request body (e.g. FormData)
    (init as any).duplex = "half";
  }

  const res = await fetch(url, init);
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  return proxy(req, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  return proxy(req, ctx);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  return proxy(req, ctx);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  return proxy(req, ctx);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  return proxy(req, ctx);
}
