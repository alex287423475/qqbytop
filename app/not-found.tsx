export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-brand-900">
      <p className="text-sm font-semibold uppercase text-slate-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold">页面未找到</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">页面不存在或已更新，请从首页重新进入。</p>
      <a
        className="mt-8 inline-flex w-fit items-center rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
        href="/zh"
      >
        返回首页
      </a>
    </main>
  );
}
