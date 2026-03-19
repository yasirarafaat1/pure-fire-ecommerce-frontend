"use client";

import { siteInfo } from "../utils/site-info";

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.privacyTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>We respect your privacy and are committed to protecting your personal information.</p>
        <p>We collect only the data required to process orders, provide support, and improve your shopping experience.</p>
        <p>We never sell your personal data. Data is shared only with trusted partners required to fulfill your order.</p>
        <p>For questions about privacy, please contact our support team.</p>
      </div>
      <div className="mt-6 grid gap-2 text-sm">
        <div className="font-semibold">{siteInfo.name}</div>
        <div>{siteInfo.supportEmail}</div>
        <div>{siteInfo.supportPhone}</div>
        <div>{siteInfo.supportLocation}</div>
      </div>
    </main>
  );
}
