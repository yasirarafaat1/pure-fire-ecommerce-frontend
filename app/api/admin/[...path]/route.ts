import { NextRequest } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://purefire-backend.onrender.com";

const normalizeBase = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed)) return `http://${trimmed}`;
  return `https://${trimmed}`;
};

const normalizedBase = normalizeBase(backendBase);
const backendRoot = normalizedBase.replace(/\/$/, "");
const publicReadPaths = new Set([
  "get-categories",
  "categories/tree",
  "get-products",
  "search-products",
  "top-products",
  "banners/public",
  "settings/public",
]);

const buildHeaders = (res: Response) => {
  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const contentDisposition = res.headers.get("content-disposition");
  const setCookie = res.headers.get("set-cookie");
  const cacheControl = res.headers.get("cache-control");
  if (contentType) headers.set("content-type", contentType);
  if (contentDisposition) headers.set("content-disposition", contentDisposition);
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
  const isPublicRead = req.method === "GET" && publicReadPaths.has(joined);
  const targetBase = isPublicRead
    ? `${backendRoot}/admin`
    : backendRoot.endsWith("/api/admin")
      ? backendRoot
      : `${backendRoot}/api/admin`;
  const url = `${targetBase}/${joined}${search}`;

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
    if (req.body) {
      init.body = req.body;
      init.duplex = "half";
    }
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
