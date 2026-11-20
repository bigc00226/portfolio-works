/* The filters of the admin pages, from the URL: ?range=30d&bots=1 */
import 'server-only';
import { parseRange, RANGES } from './stats';

export type Search = Promise<Record<string, string | string[] | undefined>>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export async function filters(searchParams: Search) {
  const sp = await searchParams;
  const range = parseRange(one(sp.range));
  const bots = one(sp.bots) === '1';
  const p = new URLSearchParams({ range: range.key });
  if (bots) p.set('bots', '1');
  return { sp, range, bots, qs: `?${p}`, ranges: RANGES.map((r) => ({ key: r.key, label: r.label })) };
}
