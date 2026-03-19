"use client";

import { siteInfo } from "../utils/site-info";

export default function SupportPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{siteInfo.supportTitle}</h1>
      <div className="grid gap-3 text-sm text-[var(--ink)]">
        <p>We are here to help with orders, returns, sizing, and product questions.</p>
        <p>Reach out and our team will respond as quickly as possible.</p>
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
