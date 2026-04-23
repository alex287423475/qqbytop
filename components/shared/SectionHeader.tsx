export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-slate-600">{subtitle}</p>}
    </div>
  );
}
