/* POST /api/track — the visitor statistics of the admin dashboard (lib/server/track.ts). */
import { record } from '@/lib/server/track';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const text = await req.text(); // navigator.sendBeacon sends text/plain
    if (text.length > 8000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
    if (!body || typeof body !== 'object') throw new Error();
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    const r = record(body, req.headers);
    if (process.env.TRACK_DEBUG) console.log('[track]', r.status, JSON.stringify(body).slice(0, 160));
    return r.json ? Response.json(r.json, { status: r.status, headers: { 'Cache-Control': 'no-store' } }) : new Response(null, { status: r.status });
  } catch (e) {
    console.error('[track]', e);
    return new Response(null, { status: 500 });
  }
}
