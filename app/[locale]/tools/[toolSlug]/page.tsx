import { notFound, redirect } from "next/navigation";
import { diagnosticTools } from "@/lib/site-data";

export default async function DiagnosticToolAliasPage({
  params,
}: {
  params: Promise<{ locale: string; toolSlug: string }>;
}) {
  const { locale, toolSlug } = await params;
  const tool = diagnosticTools.find((item) => item.href === `/tools/${toolSlug}`);

  if (!tool) notFound();

  redirect(tool.externalHref || `/${locale}${tool.href}`);
}
