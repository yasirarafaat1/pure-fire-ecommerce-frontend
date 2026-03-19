import { NextRequest } from "next/server";

const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const normalizeBase = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
};

const targetBase = normalizeBase(rawBase).replace(/\/$/, "");

const buildHeaders = (res: Response) => {
  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const setCookie = res.headers.get("set-cookie");
  const cacheControl = res.headers.get("cache-control");
  if (contentType) headers.set("content-type", contentType);
  if (cacheControl) headers.set("cache-control", cacheControl);
  if (setCookie) headers.set("set-cookie", setCookie);
  return headers;
};

async function proxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path = [] } = await context.params;
  const joined = path.join("/");
  const search = req.nextUrl.search || "";
  const url = `${targetBase}/user/${joined}${search}`;

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(
        ([key]) => !["host", "content-length", "accept-encoding"].includes(key.toLowerCase())
      )
    ),
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
    init.duplex = "half";
  }

  const res = await fetch(url, init);
  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    status: res.status,
    headers: buildHeaders(res),
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, ctx);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, ctx);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, ctx);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, ctx);
}
