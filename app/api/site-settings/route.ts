const rawBase =
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

export async function GET() {
  const target = `${normalizeBase(rawBase).replace(/\/$/, "")}/admin/settings/public`;
  const response = await fetch(target, { cache: "no-store" });
  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}
