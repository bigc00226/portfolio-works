/* POST /admin/client-error — an admin page that failed in the browser reports here (lib/admin-report.ts and the
   watchdog in app/(admin)/layout.tsx); the report goes to the server log (on Vercel: the deployment's Logs).
   Only from a signed-in browser, and small. */
import { session } from '@/lib/server/auth';

export async function POST(req: Request) {
  if (!(await session())) return new Response(null, { status: 204 });
  const text = (await req.text().catch(() => '')).slice(0, 9000);
  let r: { kind?: unknown; url?: unknown; errors?: unknown; ua?: unknown; text?: unknown } = {};
  try { r = JSON.parse(text); } catch { /* logged as received */ }
  console.error('[admin:browser]', JSON.stringify({ kind: r.kind, url: r.url, errors: r.errors, chars: r.text, ua: r.ua ?? req.headers.get('user-agent') }).slice(0, 9000));
  return new Response(null, { status: 204 });
}
