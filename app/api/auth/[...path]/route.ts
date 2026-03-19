import { NextRequest, NextResponse } from "next/server";

const backendBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const targetBase = `${backendBase.replace(/\/$/, "")}/api/auth`;

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

async function proxy(req: NextRequest, params: { path?: string[] }) {
  const joined = (params.path || []).join("/");
  const url = `${targetBase}/${joined}`;
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: Object.fromEntries(
      Array.from(req.headers.entries()).filter(
        ([key]) => !["host", "content-length", "accept-encoding"].includes(key.toLowerCase())
      )
    ),
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
    init.duplex = "half";
  }
  try {
    const res = await fetch(url, init);
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: res.status,
      headers: buildHeaders(res),
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
