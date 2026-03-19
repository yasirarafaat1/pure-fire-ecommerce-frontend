"use client";

import { siteInfo } from "../utils/site-info";

export default function TermsAndConditionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.termsTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>By using this website, you agree to our terms of service and policies.</p>
        <p>Orders are subject to availability, verification, and payment approval.</p>
        <p>Returns and exchanges follow our return policy as displayed on the product page.</p>
        <p>We reserve the right to update these terms at any time.</p>
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
