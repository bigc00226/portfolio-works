/* Sends what went wrong on an admin page in the browser to the server log (app/(admin)/admin/client-error/route.ts).
   Only from /admin, where the sign-in cookie is sent; the route ignores anyone not signed in. */
export function reportAdminError(kind: string, errors: string[]) {
  try {
    if (!location.pathname.startsWith('/admin')) return;
    const body = JSON.stringify({ kind, url: location.pathname + location.search, errors: errors.map((x) => String(x).slice(0, 800)).slice(0, 10), ua: navigator.userAgent });
    if (!navigator.sendBeacon?.('/admin/client-error', new Blob([body], { type: 'text/plain' }))) {
      void fetch('/admin/client-error', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
    }
  } catch { /* reporting must never fail the page */ }
}
