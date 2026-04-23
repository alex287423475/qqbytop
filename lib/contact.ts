import type { Locale } from "@/lib/site-data";

export const contact = {
  phone: "400-869-9562",
  phoneHref: "tel:400-869-9562",
  email: "info@qqbytop.com",
  emailHref: "mailto:info@qqbytop.com",
  address: "北京市昌平区回龙观东大街336号院1号楼5层511",
  wechatQr: "/skin/picture/wx.jpg",
  wechatHint: "扫码添加客服，发送文件或项目需求",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  qqNumber: process.env.NEXT_PUBLIC_QQ_NUMBER || "",
};

export function getWhatsappHref(locale: Locale) {
  const digits = contact.whatsappNumber.replace(/\D/g, "");
  if (!digits) return "";

  const text =
    locale === "zh"
      ? "您好，我想咨询翻译服务。"
      : locale === "ja"
        ? "翻訳サービスについて相談したいです。"
        : "Hello, I would like to ask about translation services.";

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getQqHref() {
  const digits = contact.qqNumber.replace(/\D/g, "");
  return digits ? `https://wpa.qq.com/msgrd?v=3&uin=${digits}&site=qq&menu=yes` : "";
}
