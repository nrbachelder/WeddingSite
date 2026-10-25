// Best-effort per-instance limiter; enough to slow down casual guessing on serverless.
const hits = new Map<string, number[]>();

export function rateLimited(req: Request, limit = 20, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > limit;
}
