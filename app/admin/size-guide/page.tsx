"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";

type SizeGuideSection = {
  heading: string;
  body: string;
  table: {
    headers: string[];
    rows: string[][];
  };
  order: number;
};

type SizeGuide = {
  title: string;
  intro: string;
  sections: SizeGuideSection[];
};

const emptySection = (order: number): SizeGuideSection => ({
  heading: "",
  body: "",
  table: {
    headers: ["Size", "Chest", "Waist"],
    rows: [["S", "", ""]],
  },
  order,
});

const fallbackGuide: SizeGuide = {
  title: "Size Guide",
  intro: "",
  sections: [emptySection(0)],
};

export default function AdminSizeGuidePage() {
  const [guide, setGuide] = useState<SizeGuide>(fallbackGuide);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    adminApi
      .get<{ data: SizeGuide }>("/size-guide")
      .then((response) => {
        if (response.data?.sections?.length) setGuide(response.data);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof AdminApiError
            ? requestError.message
            : "Size guide failed",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateSection = (index: number, section: SizeGuideSection) => {
    const sections = [...guide.sections];
    sections[index] = section;
    setGuide({ ...guide, sections });
  };

  const addSection = () => {
    setGuide({
      ...guide,
      sections: [...guide.sections, emptySection(guide.sections.length)],
    });
  };

  const removeSection = (index: number) => {
    setGuide({
      ...guide,
      sections: guide.sections.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const submit = async () => {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...guide,
        sections: guide.sections.map((section, index) => ({
          ...section,
          order: index,
          table: {
            headers: section.table.headers.map((item) => item.trim()).filter(Boolean),
            rows: section.table.rows.map((row) => row.map((cell) => cell.trim())),
          },
        })),
      };
      const response = await adminApi.put<{ data: SizeGuide }>("/size-guide", payload);
      setGuide(response.data);
      setMessage("Size guide updated.");
    } catch (requestError) {
      setMessage(
        requestError instanceof AdminApiError
          ? requestError.message
          : "Save failed",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingState label="Loading size guide..." />;
  if (error) return <AdminErrorState message={error} retry={load} />;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Size guide"
        description="Manage public size-guide content. The page layout stays fixed; only text and table data changes."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Page title
            <input
              value={guide.title}
              maxLength={120}
              onChange={(event) => setGuide({ ...guide, title: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-800 md:col-span-2">
            Intro text
            <textarea
              value={guide.intro}
              maxLength={2000}
              rows={4}
              onChange={(event) => setGuide({ ...guide, intro: event.target.value })}
              className="resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-4">
        {guide.sections.map((section, index) => (
          <SectionEditor
            key={`section-${index}`}
            section={section}
            index={index}
            onChange={(next) => updateSection(index, next)}
            onRemove={() => removeSection(index)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
        >
          <Plus size={16} />
          Add section
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save size guide"}
        </button>
        {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  index,
  onChange,
  onRemove,
}: {
  section: SizeGuideSection;
  index: number;
  onChange: (section: SizeGuideSection) => void;
  onRemove: () => void;
}) {
  const headersText = section.table.headers.join(" | ");
  const rowsText = section.table.rows.map((row) => row.join(" | ")).join("\n");

  const updateHeaders = (value: string) => {
    onChange({
      ...section,
      table: {
        ...section.table,
        headers: value.split("|").map((item) => item.trim()).slice(0, 8),
      },
    });
  };

  const updateRows = (value: string) => {
    onChange({
      ...section,
      table: {
        ...section.table,
        rows: value
          .split("\n")
          .map((line) => line.split("|").map((item) => item.trim()).slice(0, 8))
          .slice(0, 30),
      },
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-950">Section {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={15} />
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Sidebar heading
          <input
            value={section.heading}
            maxLength={80}
            onChange={(event) => onChange({ ...section, heading: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800 md:col-span-2">
          Main content
          <textarea
            value={section.body}
            maxLength={3000}
            rows={5}
            onChange={(event) => onChange({ ...section, body: event.target.value })}
            className="resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Table headers
          <input
            value={headersText}
            onChange={(event) => updateHeaders(event.target.value)}
            placeholder="Size | Chest | Waist"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
          <span className="text-xs text-slate-400">Separate columns with |</span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Table rows
          <textarea
            value={rowsText}
            onChange={(event) => updateRows(event.target.value)}
            rows={5}
            placeholder={"S | 38 | 30\nM | 40 | 32"}
            className="resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
          <span className="text-xs text-slate-400">One row per line, columns with |</span>
        </label>
      </div>
    </section>
  );
}
