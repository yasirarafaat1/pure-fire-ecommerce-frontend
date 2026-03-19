"use client";

import { siteInfo } from "../utils/site-info";

export default function ContactPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.contactTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>For order updates, product queries, or feedback, reach out to us below.</p>
        <p>We are happy to help and usually respond within 24-48 hours.</p>
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
