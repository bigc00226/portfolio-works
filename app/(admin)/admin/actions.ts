'use server';
/* The forms of the admin pages (Server Actions). Every action but the sign-in checks the session first. */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { changePassword, logout, requireAdmin, revokeOthers } from '@/lib/server/auth';
import { get, run, tx } from '@/lib/server/db';
import { clientIp } from '@/lib/server/client';

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

// signing in is not a Server Action: app/(admin)/admin/login/route.ts (a plain HTML form, no React)

export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}

export async function passwordAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const current = String(fd.get('current') ?? ''), next = String(fd.get('next') ?? ''), again = String(fd.get('again') ?? '');
  if (next !== again) return { error: '新しいパスワードが確認用と一致しません。' };
  const r = await changePassword(current, next);
  if (!r.ok) return { error: r.error };
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'パスワードを変更しました。ほかのブラウザーはログアウトされました。' };
}

export async function revokeAction(): Promise<void> {
  await requireAdmin();
  await revokeOthers();
  revalidatePath('/admin/settings');
}

/** hides a visitor (an IP address) from every figure, or shows it again */
export async function excludeAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get('id'));
  await run('UPDATE visitors SET excluded = ? WHERE id = ?', fd.get('excluded') === '1' ? 1 : 0, id);
  revalidatePath('/admin', 'layout');
}

export async function noteAction(fd: FormData): Promise<void> {
  await requireAdmin();
  await run('UPDATE visitors SET note = ? WHERE id = ?', String(fd.get('note') ?? '').slice(0, 200), Number(fd.get('id')));
  revalidatePath('/admin', 'layout');
}

/** hides the address this browser uses (the owner's own visits) */
export async function excludeMeAction(): Promise<void> {
  await requireAdmin();
  const ip = clientIp(await headers()), now = Date.now();
  await run('INSERT INTO visitors (ip, first_seen, last_seen, excluded) VALUES (?, ?, ?, 1) ON CONFLICT(ip) DO UPDATE SET excluded = 1', ip, now, now);
  revalidatePath('/admin', 'layout');
}

export async function deleteVisitorAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(fd.get('id'));
  await tx(async () => {
    await run('DELETE FROM events WHERE visitor_id = ?', id);
    await run('DELETE FROM views WHERE visitor_id = ?', id);
    await run('DELETE FROM visitors WHERE id = ?', id);
  });
  revalidatePath('/admin', 'layout');
  redirect('/admin/visitors');
}

export async function purgeAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  if (String(fd.get('confirm') ?? '').trim() !== '削除する') return { error: '確認のため「削除する」と入力してください。' };
  const before = String(fd.get('before') ?? '');
  if (before === 'all') {
    await tx(async () => { await run('DELETE FROM events'); await run('DELETE FROM views'); await run("DELETE FROM visitors WHERE excluded = 0"); });
    revalidatePath('/admin', 'layout');
    return { ok: true, message: 'アクセスの記録をすべて削除しました（除外中の IP アドレスの設定は残しています）。' };
  }
  const days = Number(before);
  if (![30, 90, 180, 365].includes(days)) return { error: '期間を選んでください。' };
  const cut = Date.now() - days * 86_400_000;
  const n = (await get<{ n: number }>('SELECT COUNT(*) AS n FROM views WHERE ts < ?', cut))!.n;
  await tx(async () => {
    await run('DELETE FROM events WHERE ts < ?', cut);
    await run('DELETE FROM views WHERE ts < ?', cut);
    await run('DELETE FROM visitors WHERE excluded = 0 AND NOT EXISTS (SELECT 1 FROM views WHERE views.visitor_id = visitors.id)');
  });
  revalidatePath('/admin', 'layout');
  return { ok: true, message: `${days} 日より前のページビュー ${n.toLocaleString('ja-JP')} 件を削除しました。` };
}
