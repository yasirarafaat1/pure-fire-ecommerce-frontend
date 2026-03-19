"use client";

import { siteInfo } from "../utils/site-info";

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Delivery timelines vary by location. You will receive tracking once your order ships.",
  },
  {
    q: "What is your return and exchange policy?",
    a: "Returns and exchanges are available within 7 days of delivery, subject to eligibility.",
  },
  {
    q: "How can I contact support?",
    a: "Use the email or phone details below to reach our support team.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can be changed or cancelled before they are dispatched from our warehouse.",
  },
];

export default function FaqsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">FAQs</h1>
      <div className="grid gap-4 text-sm text-[var(--ink)]">
        {faqs.map((item) => (
          <div key={item.q} className="border border-black/10 rounded-[5px] p-4">
            <div className="font-semibold">{item.q}</div>
            <div className="mt-2 text-[var(--muted)]">{item.a}</div>
          </div>
        ))}
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
