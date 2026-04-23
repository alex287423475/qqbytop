import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { locales, type Locale } from "@/lib/site-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isChinese = locale === "zh";

  return {
    robots: isChinese ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  return (
    <>
      <Header locale={locale as Locale} />
      <main>{children}</main>
      <Footer locale={locale as Locale} />
      <FloatingContact locale={locale as Locale} />
    </>
  );
}
