"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
  FiYoutube,
} from "react-icons/fi";
import {
  defaultPublicSettings,
  fetchPublicSettings,
} from "../utils/public-settings";

const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Your one-stop shop for all your needs.";

const links = {
  shop: [
    { label: "All Collections", href: "/collections/all" },
    { label: "Top Products", href: "/" },
    { label: "New Arrivals", href: "/collections/new-arrival" },
    { label: "Best Sellers", href: "/collections/best-seller" },
  ],
  help: [
    { label: "Orders", href: "/orders" },
    { label: "Returns & Exchange", href: "/return-policy" },
    { label: "Support", href: "/support" },
    { label: "Shipping Info", href: "/shipping-info" },
  ],
  policy: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Contact", href: "/contact" },
  ],
};

const trustItems = ["Secure payments", "Fast shipping", "Easy returns"];

const headingClass =
  "footer-column-title text-[11px] font-black uppercase tracking-[0.22em] text-slate-950";

const linkClass =
  "footer-link group relative inline-flex w-fit items-center text-sm font-semibold text-slate-500 transition-colors duration-300 hover:text-slate-950";

function FooterColumn({
  title,
  items,
  delay,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  delay: number;
}) {
  return (
    <div
      className="footer-reveal footer-column"
      style={{ "--footer-delay": `${delay}ms` } as React.CSSProperties}
    >
      <div className={headingClass}>{title}</div>

      <ul className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li
            key={item.label}
            className="footer-link-row"
            style={{ "--link-delay": `${index * 55}ms` } as React.CSSProperties}
          >
            <a href={item.href} className={linkClass}>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const footerRef = useRef<HTMLElement | null>(null);

  const [settings, setSettings] = useState(defaultPublicSettings);
  const [logoSrc, setLogoSrc] = useState(
    defaultPublicSettings.seo?.logoUrl || "/favicon.png",
  );
  const [revealed, setRevealed] = useState(false);

  const social = settings.socialLinks || {};
  const year = new Date().getFullYear();

  const socialLinks = useMemo(
    () => [
      {
        label: "Instagram",
        href: social.instagram,
        icon: <FiInstagram />,
      },
      {
        label: "Facebook",
        href: social.facebook,
        icon: <FiFacebook />,
      },
      {
        label: "YouTube",
        href: social.youtube,
        icon: <FiYoutube />,
      },
      {
        label: "Twitter",
        href: social.twitter,
        icon: <FiTwitter />,
      },
    ],
    [social.facebook, social.instagram, social.twitter, social.youtube],
  );

  useEffect(() => {
    fetchPublicSettings()
      .then((nextSettings) => {
        setSettings(nextSettings);
        setLogoSrc(nextSettings.seo?.logoUrl || "/favicon.png");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const footer = footerRef.current;

    if (!footer) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -80px 0px",
      },
    );

    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={footerRef}
      className={`premium-footer relative mt-14 overflow-hidden border-t border-black/10 bg-white ${
        revealed ? "footer-visible" : ""
      }`}
    >
      <div className="footer-glow footer-glow-left" />
      <div className="footer-glow footer-glow-right" />

      <div className="footer-line" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-5 lg:px-8 lg:py-10">
        <div className="grid gap-9 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] lg:gap-12">
          <div
            className="footer-reveal footer-brand-block"
            style={{ "--footer-delay": "0ms" } as React.CSSProperties}
          >
            <a
              href="/"
              aria-label={`${settings.storeName} home`}
              className="footer-brand group inline-flex max-w-full items-center gap-2"
            >
              <span className="footer-logo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt={settings.storeName}
                  width={44}
                  height={44}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setLogoSrc("/favicon.png")}
                />
              </span>

              <span className="footer-brand-name w-full truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {settings.storeName}
              </span>
            </a>

            <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-slate-500">
              {siteDescription}
            </p>

            <div className="mt-6 grid gap-3 text-sm">
              {settings.supportEmail ? (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="footer-contact-link group"
                >
                  <span className="footer-contact-icon">
                    <FiMail />
                  </span>
                  <span className="min-w-0 truncate">{settings.supportEmail}</span>
                </a>
              ) : null}

              {settings.supportPhone ? (
                <a
                  href={`tel:${settings.supportPhone}`}
                  className="footer-contact-link group"
                >
                  <span className="footer-contact-icon">
                    <FiPhone />
                  </span>
                  <span className="min-w-0 truncate">{settings.supportPhone}</span>
                </a>
              ) : null}

              {settings.address ? (
                <div className="footer-contact-link">
                  <span className="footer-contact-icon">
                    <FiMapPin />
                  </span>
                  <span className="min-w-0 leading-5">{settings.address}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((item, index) => {
                if (!item.href) return null;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social"
                    style={
                      { "--social-delay": `${index * 70}ms` } as React.CSSProperties
                    }
                  >
                    <span className="relative z-10">{item.icon}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Shop" items={links.shop} delay={110} />
          <FooterColumn title="Help" items={links.help} delay={190} />
          <FooterColumn title="Policy" items={links.policy} delay={270} />
        </div>

        <div
          className="footer-bottom footer-reveal mt-8 flex flex-col gap-4 border-t border-black/10 pt-5 text-xs font-semibold text-slate-500 md:flex-row md:items-center md:justify-between"
          style={{ "--footer-delay": "360ms" } as React.CSSProperties}
        >
          <span className="text-center md:text-left">
            Copyright © {year} {settings.storeName}. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {trustItems.map((item, index) => (
              <span
                key={item}
                className="footer-trust-pill"
                style={
                  { "--trust-delay": `${index * 80}ms` } as React.CSSProperties
                }
              >
                {item}
              </span>
            ))}
          </div>
          <p>Developed by <b>Akamify</b> </p>
        </div>
      </div>

      <style jsx>{`
        .premium-footer {
          background:
            radial-gradient(circle at 8% 0%, rgba(245, 158, 11, 0.1), transparent 28%),
            radial-gradient(circle at 92% 20%, rgba(15, 23, 42, 0.06), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #fbfaf8 58%, #ffffff 100%);
        }

        .footer-line {
          position: absolute;
          left: 50%;
          top: 0;
          z-index: 2;
          height: 1px;
          width: min(1180px, calc(100% - 32px));
          background: linear-gradient(
            90deg,
            transparent,
            rgba(15, 23, 42, 0.22),
            transparent
          );
          transform: translateX(-50%) scaleX(0);
          transform-origin: center;
          transition: transform 1100ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-visible .footer-line {
          transform: translateX(-50%) scaleX(1);
        }

        .footer-glow {
          position: absolute;
          z-index: 0;
          width: 280px;
          height: 280px;
          border-radius: 999px;
          filter: blur(54px);
          opacity: 0;
          transform: scale(0.75);
          transition:
            opacity 1200ms ease,
            transform 1200ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }

        .footer-glow-left {
          left: -110px;
          top: 24px;
          background: rgba(245, 158, 11, 0.13);
        }

        .footer-glow-right {
          right: -120px;
          bottom: -80px;
          background: rgba(15, 23, 42, 0.08);
        }

        .footer-visible .footer-glow {
          opacity: 1;
          transform: scale(1);
        }

        .footer-reveal {
          opacity: 0;
          transform: translateY(26px);
          filter: blur(8px);
          transition:
            opacity 760ms ease,
            transform 860ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 860ms ease;
          transition-delay: var(--footer-delay, 0ms);
        }

        .footer-visible .footer-reveal {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .footer-brand {
          position: relative;
          isolation: isolate;
        }

        .footer-brand::before {
          content: "";
          position: absolute;
          inset: -9px -12px;
          z-index: -1;
          border-radius: 999px;
          background:
            linear-gradient(135deg, rgba(245, 158, 11, 0.12), transparent),
            rgba(15, 23, 42, 0.04);
          opacity: 0;
          transform: scale(0.86);
          transition:
            opacity 320ms ease,
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-brand:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .footer-logo-wrap {
          position: relative;
          display: grid;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          place-items: center;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          box-shadow:
            0 14px 34px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition:
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 360ms ease,
            border-color 360ms ease;
        }

        .footer-logo-wrap::after {
          content: "";
          position: absolute;
          inset: -55%;
          background: linear-gradient(
            115deg,
            transparent 35%,
            rgba(255, 255, 255, 0.7),
            transparent 65%
          );
          transform: translateX(-120%) rotate(18deg);
          transition: transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-brand:hover .footer-logo-wrap {
          transform: translateY(-2px) scale(1.05);
          border-color: rgba(245, 158, 11, 0.5);
          box-shadow:
            0 18px 42px rgba(15, 23, 42, 0.16),
            0 0 0 6px rgba(245, 158, 11, 0.08);
        }

        .footer-brand:hover .footer-logo-wrap::after {
          transform: translateX(120%) rotate(18deg);
        }

        .footer-brand-name {
          font-family: var(--font-display), Georgia, "Times New Roman", serif;
          line-height: 0.96;
          letter-spacing: -0.05em;
        }

        .footer-contact-link {
          position: relative;
          display: inline-flex;
          width: fit-content;
          max-width: 100%;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          color: #475569;
          font-weight: 700;
          transition:
            color 260ms ease,
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-contact-link:hover {
          color: #020617;
          transform: translateX(3px);
        }

        .footer-contact-icon {
          display: grid;
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: #ffffff;
          color: #020617;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.07);
          transition:
            background 260ms ease,
            color 260ms ease,
            border-color 260ms ease,
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-contact-link:hover .footer-contact-icon {
          background: #020617;
          color: #ffffff;
          border-color: #020617;
          transform: scale(1.05);
        }

        .footer-social {
          position: relative;
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          overflow: hidden;
          border-radius: 10px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255, 255, 255, 0.78);
          color: #020617;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          opacity: 0;
          transform: translateY(14px) scale(0.92);
          transition:
            opacity 560ms ease,
            transform 620ms cubic-bezier(0.22, 1, 0.36, 1),
            background 260ms ease,
            color 260ms ease,
            border-color 260ms ease;
          transition-delay: calc(var(--footer-delay, 0ms) + var(--social-delay, 0ms));
        }

        .footer-visible .footer-social {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .footer-social::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #020617;
          transform: translateY(105%);
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-social:hover {
          color: #ffffff;
          border-color: #020617;
          transform: translateY(-3px) scale(1.04);
        }

        .footer-social:hover::before {
          transform: translateY(0);
        }

        .footer-column-title {
          position: relative;
          width: fit-content;
          padding-bottom: 9px;
        }

        .footer-column-title::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 34px;
          border-radius: 999px;
          background: #020617;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: calc(var(--footer-delay, 0ms) + 160ms);
        }

        .footer-visible .footer-column-title::after {
          transform: scaleX(1);
        }

        .footer-link-row {
          opacity: 0;
          transform: translateX(-10px);
          transition:
            opacity 560ms ease,
            transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: calc(var(--footer-delay, 0ms) + var(--link-delay, 0ms) + 120ms);
        }

        .footer-visible .footer-link-row {
          opacity: 1;
          transform: translateX(0);
        }

        .footer-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 1px;
          width: 100%;
          border-radius: 999px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        .footer-link span {
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .footer-link:hover span {
          transform: translateX(4px);
        }

        .footer-trust-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          background: rgba(255, 255, 255, 0.8);
          padding: 7px 11px;
          color: #475569;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 500ms ease,
            transform 580ms cubic-bezier(0.22, 1, 0.36, 1),
            background 260ms ease,
            color 260ms ease,
            border-color 260ms ease;
          transition-delay: calc(var(--footer-delay, 0ms) + var(--trust-delay, 0ms) + 120ms);
        }

        .footer-visible .footer-trust-pill {
          opacity: 1;
          transform: translateY(0);
        }

        .footer-trust-pill:hover {
          border-color: #020617;
          background: #020617;
          color: #ffffff;
        }

        @media (max-width: 767px) {
          .footer-brand-name {
            max-width: 240px;
          }

          .footer-reveal {
            transform: translateY(20px);
          }

          .footer-contact-link {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-line,
          .footer-glow,
          .footer-reveal,
          .footer-logo-wrap,
          .footer-logo-wrap::after,
          .footer-brand::before,
          .footer-contact-link,
          .footer-contact-icon,
          .footer-social,
          .footer-social::before,
          .footer-column-title::after,
          .footer-link-row,
          .footer-link,
          .footer-link::after,
          .footer-link span,
          .footer-trust-pill {
            transition: none !important;
            animation: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </footer>
  );
}