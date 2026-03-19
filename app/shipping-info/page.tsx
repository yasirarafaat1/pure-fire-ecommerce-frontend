"use client";

import { siteInfo } from "../utils/site-info";

export default function ShippingInfoPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.shippingTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>Orders are processed quickly after confirmation. Delivery timelines vary by location.</p>
        <p>Shipping details and tracking are shared via email or SMS once dispatched.</p>
        <p>For delivery questions, contact our support team.</p>
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
