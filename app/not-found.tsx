export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold">页面未找到</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        当前 URL 没有匹配到已迁移的 PHP 渲染页面。请从首页重新进入。
      </p>
      <a
        className="mt-8 inline-flex w-fit items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        href="/"
      >
        返回首页
      </a>
    </main>
  );
}
