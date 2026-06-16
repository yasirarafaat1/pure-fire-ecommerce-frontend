"use client";

import { useEffect, useState } from "react";
import { defaultPublicSettings, fetchPublicSettings } from "../utils/public-settings";

type Section = {
  title: string;
  body: string[];
};

type Props = {
  title: string;
  intro: string;
  sections: Section[];
  updated?: string;
};

export default function PolicyPage({ title, intro, sections, updated }: Props) {
  const [settings, setSettings] = useState(defaultPublicSettings);

  useEffect(() => {
    fetchPublicSettings()
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="border-b border-black/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          {settings.storeName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{intro}</p>
        {updated && <p className="mt-3 text-xs text-[var(--muted)]">Last updated: {updated}</p>}
      </div>

      <div className="mt-8 grid gap-6">
        {sections.map((section) => (
          <section className="rounded-xl border border-black/10 bg-white p-5" key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--ink)]">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5 text-sm">
        <h2 className="font-semibold">Need help?</h2>
        <div className="mt-3 grid gap-1 text-[var(--muted)]">
          <p>{settings.storeName}</p>
          <a className="underline underline-offset-4" href={`mailto:${settings.supportEmail}`}>
            {settings.supportEmail}
          </a>
          <a className="underline underline-offset-4" href={`tel:${settings.supportPhone}`}>
            {settings.supportPhone}
          </a>
          <p>{settings.address}</p>
        </div>
      </section>
    </main>
  );
}
