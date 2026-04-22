"use client";

import { useEffect, useRef } from "react";

type LegacyHtmlProps = {
  html: string;
  title: string;
};

export function LegacyHtml({ html, title }: LegacyHtmlProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = title || "北京全球博译翻译公司";

    const root = rootRef.current;
    if (!root) return;

    const scripts = Array.from(root.querySelectorAll("script"));
    for (const oldScript of scripts) {
      const nextScript = document.createElement("script");

      for (const attr of Array.from(oldScript.attributes)) {
        nextScript.setAttribute(attr.name, attr.value);
      }

      nextScript.text = oldScript.text;
      oldScript.replaceWith(nextScript);
    }
  }, [html, title]);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
