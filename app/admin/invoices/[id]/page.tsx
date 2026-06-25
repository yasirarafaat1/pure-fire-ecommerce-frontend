"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import AdminPageHeader from "../../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../../components/AdminStates";
import { AdminApiError, adminApi } from "../../lib/adminApi";
import { dash, formatInvoiceDate, formatInvoiceMoney } from "../invoiceFormat";

type InvoiceItem = {
  productName?: string;
  sku?: string;
  variant?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  gstRate?: number;
  gstAmount?: number;
  lineTotal?: number;
};

type Invoice = {
  _id: string;
  invoiceNumber?: string;
  orderNumber?: number;
  issuedAt?: string;
  companySnapshot?: {
    businessName?: string;
    legalName?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    email?: string;
    phone?: string;
    gstin?: string;
  };
  customerSnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
    billingAddress?: string;
    shippingAddress?: string;
  };
  orderSnapshot?: {
    orderDate?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    transactionId?: string;
    currency?: string;
  };
  items?: InvoiceItem[];
  totals?: {
    subtotal?: number;
    discount?: number;
    shippingCharge?: number;
    taxableAmount?: number;
    gstTotal?: number;
    grandTotal?: number;
  };
};

const downloadPdf = async (invoice: Invoice) => {
  const response = await fetch(`/api/admin/invoices/${invoice._id}/download`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Download failed");
  }

  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    adminApi
      .get<{ data: Invoice }>(`/invoices/${params.id}`)
      .then((response) => setInvoice(response.data))
      .catch((requestError) =>
        setError(requestError instanceof AdminApiError ? requestError.message : "Invoice failed"),
      );
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <AdminErrorState message={error} retry={load} />;
  if (!invoice) return <AdminLoadingState label="Loading invoice..." />;

  const company = invoice.companySnapshot || {};
  const customer = invoice.customerSnapshot || {};
  const order = invoice.orderSnapshot || {};
  const totals = invoice.totals || {};
  const currency = order.currency || "INR";

  const toNumber = (value?: number) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const discountAsNegative = (value?: number) => {
    const amount = Math.abs(toNumber(value));
    return amount > 0 ? -amount : 0;
  };

  const totalRows: Array<[string, number | undefined]> = [
    ["Subtotal", totals.subtotal],
    ["Discount", discountAsNegative(totals.discount)],
    ["Shipping", totals.shippingCharge],
    ["GST", totals.gstTotal],
    ["Grand Total", totals.grandTotal],
  ];

  return (
    <div className="grid min-w-0 gap-6">
      <AdminPageHeader
        title={dash(invoice.invoiceNumber)}
        description={`Invoice for order ${invoice.orderNumber ? `#${invoice.orderNumber}` : "-"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
              onClick={() => {
                setMessage("");
                downloadPdf(invoice).catch((downloadError) =>
                  setMessage(downloadError instanceof Error ? downloadError.message : "Download failed"),
                );
              }}
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        }
      />

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <section className="min-w-0 overflow-hidden rounded-xl bg-white p-4 text-slate-950 shadow-sm ring-1 ring-slate-200 sm:p-6 lg:p-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
          <div className="min-w-0 text-sm leading-6">
            <h3 className="break-words text-lg font-bold">
              {dash(company.businessName || company.legalName)}
            </h3>
            <p className="break-words">{dash(company.address)}</p>
            <p className="break-words">
              {dash([company.city, company.state, company.postalCode].filter(Boolean).join(", "))}
            </p>
            <p className="break-words">{dash(company.country)}</p>
            <p className="break-all">{dash(company.email)}</p>
            <p className="break-words">{dash(company.phone)}</p>
            <p className="break-words">
              <span className="font-semibold">GSTIN:</span> {dash(company.gstin)}
            </p>
          </div>

          <div className="grid min-w-0 gap-3 text-sm lg:justify-self-end">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-right">
              INVOICE
            </h2>

            <div className="grid w-full min-w-0 gap-2 lg:w-[360px]">
              <Meta label="Invoice No" value={dash(invoice.invoiceNumber)} />
              <Meta label="Invoice Date" value={formatInvoiceDate(invoice.issuedAt)} />
              <Meta label="Order ID" value={invoice.orderNumber ? `#${invoice.orderNumber}` : "-"} />
              <Meta label="Order Date" value={formatInvoiceDate(order.orderDate)} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid min-w-0 gap-20 md:grid-cols-2">
          <Section
            title="Ship To"
            lines={[customer.name, customer.phone, customer.email, customer.shippingAddress]}
          />

          <Section
            title="Payment Details"
            lines={[
              `Payment Method: ${dash(order.paymentMethod)}`,
              `Payment Status: ${dash(order.paymentStatus)}`,
              `Transaction ID: ${dash(order.transactionId)}`,
            ]}
          />
        </div>

        <div className="mt-10 min-w-0 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-[220px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-16" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[80px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="border-b-2 border-slate-950 bg-white">
              <tr>
                {[
                  "#",
                  "Description",
                  "SKU",
                  "Variant",
                  "Qty",
                  "Rate",
                  "Discount",
                  "GST %",
                  "GST Amount",
                  "Amount",
                ].map((label, index) => (
                  <th
                    className={`px-3 py-3 font-bold ${
                      index >= 4 ? "text-right" : "text-left"
                    }`}
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(invoice.items || []).map((item, index) => (
                <tr
                  className="border-b border-slate-200 last:border-b-0"
                  key={`${item.sku || item.productName}-${index}`}
                >
                  <td className="px-3 py-3 align-top">{index + 1}</td>

                  <td className="px-3 py-3 align-top">
                    <span className="block break-words">{dash(item.productName)}</span>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <span className="block break-all">{dash(item.sku)}</span>
                  </td>

                  <td className="px-3 py-3 align-top">
                    <span className="block break-words">{dash(item.variant)}</span>
                  </td>

                  <td className="px-3 py-3 text-right align-top">{dash(item.quantity)}</td>

                  <td className="px-3 py-3 text-right align-top">
                    {formatInvoiceMoney(item.unitPrice, currency)}
                  </td>

                  <td className="px-3 py-3 text-right align-top">
                    {formatInvoiceMoney(discountAsNegative(item.discount), currency)}
                  </td>

                  <td className="px-3 py-3 text-right align-top">
                    {item.gstRate === undefined || item.gstRate === null
                      ? "-"
                      : Number(item.gstRate).toFixed(2)}
                  </td>

                  <td className="px-3 py-3 text-right align-top">
                    {formatInvoiceMoney(item.gstAmount, currency)}
                  </td>

                  <td className="px-3 py-3 text-right align-top">
                    {formatInvoiceMoney(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid min-w-0 justify-items-end">
          <div className="w-full max-w-sm text-sm">
            {totalRows.map(([label, value], index) => (
              <div
                className={`flex items-center justify-between gap-4 border-b border-slate-200 py-2 ${
                  index === totalRows.length - 1 ? "border-slate-950 text-lg font-bold" : ""
                }`}
                key={label}
              >
                <span>{label}</span>
                <span className="shrink-0 text-right">{formatInvoiceMoney(value, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center text-sm leading-6 text-slate-700">
          <p>Thank you for shopping with us.</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-3">
      <span className="font-bold">{label}:</span>
      <span className="min-w-0 break-words text-right">{value}</span>
    </div>
  );
}

function Section({ title, lines }: { title: string; lines: Array<string | undefined> }) {
  return (
    <div className="grid min-w-0 content-start gap-1 text-sm leading-6">
      <h3 className="font-bold">{title}</h3>
      {lines.map((line, index) => (
        <p className="min-w-0 break-words" key={`${title}-${index}`}>
          {dash(line)}
        </p>
      ))}
    </div>
  );
}