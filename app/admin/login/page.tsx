import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "后台登录",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <section className="w-full max-w-md border border-slate-700 bg-white p-6">
        <p className="text-sm font-semibold text-blue-700">Admin</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">后台登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          用于保护 <code>/admin/*</code> 路由。生产环境请配置 <code>ADMIN_PASSWORD</code> 和 <code>ADMIN_SESSION_TOKEN</code>。
        </p>
        <LoginForm searchParams={searchParams} />
      </section>
    </main>
  );
}

async function LoginForm({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params.next || "/admin/gaokao-essay";
  return (
    <form action="/api/admin/login" method="post" className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-700">管理员密码</span>
        <input
          type="password"
          name="password"
          className="h-12 border border-slate-300 px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" className="h-12 bg-blue-700 font-semibold text-white transition hover:bg-blue-800">
        登录
      </button>
    </form>
  );
}
