import type { Metadata } from "next";
import { siteConfig } from "../config/metadata";
import OrderFailedClient from "./OrderFailedClient";

type PageProps = {
  searchParams?: Promise<{ order_id?: string; reason?: string }>;
};

const formatOrderId = (value?: string) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const orderId = formatOrderId(params?.order_id);
  const reason = params?.reason || "Payment could not be completed.";
  const title = orderId ? `Payment Failed for Order #${orderId}` : "Payment Failed";
  const description = orderId
    ? `Payment for Pure Fire order #${orderId} failed. Reason: ${reason}`
    : `Pure Fire payment failed. Reason: ${reason}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}/order-failed`,
    },
    twitter: {
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export default async function OrderFailedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <OrderFailedClient
      orderIdRaw={params?.order_id || ""}
      reason={params?.reason || ""}
    />
  );
}
