import type { ReactNode } from "react";

export function ToolPageLayout({
  children,
  resultPanel,
}: {
  children: ReactNode;
  resultPanel: ReactNode;
}) {
  return (
    <main className="essay-tool">
      <div className="essay-shell">
        <section className="essay-main-panel">{children}</section>
        <aside className="essay-side-panel" id="essay-result-panel">
          {resultPanel}
        </aside>
      </div>
    </main>
  );
}
