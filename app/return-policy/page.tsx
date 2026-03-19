"use client";

import { siteInfo } from "../utils/site-info";

export default function ReturnPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.returnsTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>7 days easy returns and exchange from the date of delivery.</p>
        <p>Products must be unused, unwashed, and in original packaging.</p>
        <p>Refunds are processed to the original payment method for prepaid orders.</p>
        <p>Exchanges are subject to stock availability and can be initiated only once per product.</p>
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
