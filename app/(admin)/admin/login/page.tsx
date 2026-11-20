import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { session } from '@/lib/server/auth';
import { LoginForm } from '@/components/admin/ui';
import { Mark } from '@/components/admin/Shell';
import { loginAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ログイン' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await session()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <div className="login">
      <div className="login-card">
        <div className="ad-brand"><Mark /><div><b>Trust Portfolio</b><small>ANALYTICS</small></div></div>
        <h1>管理画面にログイン</h1>
        <p>アクセス状況のダッシュボードを見るには、パスワードを入力してください。</p>
        <LoginForm action={loginAction} next={next ?? '/admin'} />
      </div>
    </div>
  );
}
