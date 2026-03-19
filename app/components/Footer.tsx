"use client";

import {
  FiInstagram,
  FiFacebook,
  FiYoutube,
  FiTwitter,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pure Fire";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Your one-stop shop for all your needs.";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@purefire.com";
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 79053 25078";
const supportLocation = process.env.NEXT_PUBLIC_SUPPORT_LOCATION || "India";

const social = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "#",
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "#",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "#",
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "#",
};

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

const headingClass = "text-xs font-semibold tracking-[0.2em] uppercase";
const linkClass = "hover:underline underline-offset-4 transition-colors hover:text-black/70";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-black/10 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5 py-5">
          <div className="flex flex-col gap-3 col-span-2 lg:col-span-1 space-y-4">
            <div className="text-xl font-semibold tracking-tight">{siteName}</div>
            <p className="text-sm text-[var(--muted)] max-w-xs">
              {siteDescription}
            </p>
            <div className="flex flex-col gap-2 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FiMail className="text-black" />
                <a href={`mailto:${supportEmail}`} className="underline-offset-4 hover:underline transition-colors hover:text-black/70">{supportEmail}</a>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-black" />
                <a href={`tel:${supportPhone}`} className="underline-offset-4 hover:underline transition-colors hover:text-black/70">{supportPhone}</a>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="text-black" />
                <span>{supportLocation}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a href={social.instagram} aria-label="Instagram" className="w-9 h-9 border border-black/15 rounded-[5px] flex items-center justify-center transition-colors text-black hover:text-white hover:bg-black hover:border-black">
                <FiInstagram className="text-black transition-colors hover:text-white" />
              </a>
              <a href={social.facebook} aria-label="Facebook" className="w-9 h-9 border border-black/15 rounded-[5px] flex items-center justify-center transition-colors text-black hover:text-white hover:bg-black hover:border-black">
                <FiFacebook className="text-black transition-colors hover:text-white" />
              </a>
              <a href={social.youtube} aria-label="YouTube" className=" w-9 h-9 border border-black/15 rounded-[5px] flex items-center justify-center transition-colors text-black hover:text-white hover:bg-black hover:border-black">
                <FiYoutube className="text-black transition-colors hover:text-white" />
              </a>
              <a href={social.twitter} aria-label="Twitter" className="w-9 h-9 border border-black/15 rounded-[5px] flex items-center justify-center transition-colors text-black hover:text-white hover:bg-black hover:border-black">
                <FiTwitter className="text-black transition-colors hover:text-white" />
              </a>
            </div>
          </div>

          <div>
            <div className={headingClass}>Shop</div>
            <ul className="mt-4 space-y-2 text-sm">
              {links.shop.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={headingClass}>Help</div>
            <ul className="mt-4 space-y-2 text-sm">
              {links.help.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={headingClass}>Policy</div>
            <ul className="mt-4 space-y-2 text-sm">
              {links.policy.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-4 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>Copyright (c) {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Secure payments</span>
            <span>Fast shipping</span>
            <span>Easy returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}







