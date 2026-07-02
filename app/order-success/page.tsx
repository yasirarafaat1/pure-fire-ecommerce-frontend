import type { Metadata } from "next";
import { siteConfig } from "../config/metadata";
import OrderSuccessClient from "./OrderSuccessClient";

type PageProps = {
  searchParams?: Promise<{ order_id?: string }>;
};

const formatOrderId = (value?: string) => {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value.padStart(6, "0");
  return value;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const orderId = formatOrderId(params?.order_id);
  const title = orderId ? `Order #${orderId} Confirmed` : "Order Confirmed";
  const description = orderId
    ? `Your Pure Fire order #${orderId} has been placed successfully and payment is confirmed.`
    : "Your Pure Fire order has been placed successfully and payment is confirmed.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}/order-success`,
    },
    twitter: {
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <OrderSuccessClient orderIdRaw={params?.order_id || ""} />;
}
