"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-IN");

export const formatInr = (value?: number | null) => inr.format(Number(value || 0));
export const formatCount = (value?: number | null) => count.format(Number(value || 0));
export const formatPercent = (value?: number | null) => `${Number(value || 0).toFixed(1)}%`;

export function AnalyticsKpiCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 text-slate-500">
        <span className="text-sm">{label}</span>
        <span className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </article>
  );
}

export function AnalyticsEmptyState({ message = "Tracking not available yet." }: { message?: string }) {
  return (
    <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function AnalyticsLineChart({
  title,
  data,
  lines,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  lines: Array<{ key: string; label: string; color: string; currency?: boolean }>;
}) {
  return (
    <ChartCard title={title}>
      {data.length ? (
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 14, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }}
                formatter={(value, name) => {
                  const line = lines.find((item) => item.key === name);
                  return [line?.currency ? formatInr(Number(value)) : formatCount(Number(value)), line?.label || name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              {lines.map((line) => (
                <Line
                  animationDuration={500}
                  dataKey={line.key}
                  dot={false}
                  key={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <AnalyticsEmptyState message="No chart data available for this range." />
      )}
    </ChartCard>
  );
}

export function AnalyticsBarChart({
  title,
  data,
  bars,
  xKey,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; label: string; color: string; currency?: boolean }>;
  xKey: string;
}) {
  return (
    <ChartCard title={title}>
      {data.length ? (
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 14, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} minTickGap={14} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                contentStyle={{ borderRadius: 8, borderColor: "#cbd5e1" }}
                formatter={(value, name) => {
                  const bar = bars.find((item) => item.key === name);
                  return [bar?.currency ? formatInr(Number(value)) : formatCount(Number(value)), bar?.label || name];
                }}
              />
              <Legend />
              {bars.map((bar) => (
                <Bar animationDuration={500} dataKey={bar.key} fill={bar.color} key={bar.key} name={bar.label} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <AnalyticsEmptyState message="No chart data available for this range." />
      )}
    </ChartCard>
  );
}

export function AnalyticsTableCard<T>({
  title,
  columns,
  rows,
  empty = "No data available.",
}: {
  title: string;
  columns: Array<{ key: string; label: string; render: (row: T) => ReactNode }>;
  rows: T[];
  empty?: string;
}) {
  return (
    <ChartCard title={title}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th className="px-3 py-2" key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr className="border-t border-slate-100 transition hover:bg-slate-50" key={index}>
                  {columns.map((column) => (
                    <td className="px-3 py-2" key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AnalyticsEmptyState message={empty} />
      )}
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}
