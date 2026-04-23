import Script from "next/script";

export function LiveChatScript() {
  const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  if (!crispWebsiteId) return null;

  return (
    <>
      <Script id="crisp-config" strategy="afterInteractive">
        {`window.$crisp=[];window.CRISP_WEBSITE_ID="${crispWebsiteId}";`}
      </Script>
      <Script src="https://client.crisp.chat/l.js" strategy="afterInteractive" />
    </>
  );
}
