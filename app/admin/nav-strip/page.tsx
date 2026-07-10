"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Clock3, Edit3, Link2, Plus, Save, Trash2, X } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import { AdminErrorState, AdminLoadingState } from "../components/AdminStates";
import { AdminApiError, adminApi } from "../lib/adminApi";

type NavStripItem = {
  _id: string;
  text: string;
  textHtml?: string;
  isActive: boolean;
  order: number;
  timer?: NavStripTimer;
};

type NavStripTimer = {
  enabled: boolean;
  position: "start" | "end";
  mode: "loop" | "one_time";
  durationMinutes: number;
  startAt?: string | null;
  icon?: "clock";
};

type NavStripForm = {
  text: string;
  textHtml: string;
  isActive: boolean;
  order: number;
  timer: NavStripTimer;
};

type NavStripSettings = {
  durationSeconds: number;
};

type LinkEditState = {
  anchor: HTMLAnchorElement | null;
  selectedText: string;
};

const emptyForm: NavStripForm = {
  text: "",
  textHtml: "",
  isActive: true,
  order: 0,
  timer: {
    enabled: false,
    position: "start",
    mode: "loop",
    durationMinutes: 60,
    startAt: "",
    icon: "clock",
  },
};

const TEXT_LIMIT = 120;

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const fromDatetimeLocal = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export default function AdminNavStripPage() {
  const [items, setItems] = useState<NavStripItem[]>([]);
  const [settings, setSettings] = useState<NavStripSettings>({ durationSeconds: 4 });
  const [form, setForm] = useState<NavStripForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const load = () => {
    setLoading(true);
    setError("");
    adminApi
      .get<{ data: NavStripItem[]; settings?: NavStripSettings }>("/nav-strip")
      .then((response) => {
        setItems(response.data || []);
        setSettings({
          durationSeconds: Math.min(10, Math.max(1, Number(response.settings?.durationSeconds || 4))),
        });
      })
      .catch((requestError) =>
        setError(
          requestError instanceof AdminApiError
            ? requestError.message
            : "Nav strip failed",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId("");
    setEditorOpen(false);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, order: items.length });
    setEditingId("");
    setEditorOpen(true);
    setMessage("");
  };

  const edit = (item: NavStripItem) => {
    setEditingId(item._id);
    setForm({
      text: item.text || "",
      textHtml: item.textHtml || item.text || "",
      isActive: Boolean(item.isActive),
      order: Number(item.order || 0),
      timer: {
        enabled: Boolean(item.timer?.enabled),
        position: item.timer?.position === "end" ? "end" : "start",
        mode: item.timer?.mode === "one_time" ? "one_time" : "loop",
        durationMinutes: Math.min(43200, Math.max(1, Number(item.timer?.durationMinutes || 60))),
        startAt: toDatetimeLocal(item.timer?.startAt || ""),
        icon: "clock",
      },
    });
    setEditorOpen(true);
    setMessage("");
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setMessage("");
    try {
      const nextDuration = Math.min(10, Math.max(1, Number(settings.durationSeconds || 4)));
      await adminApi.put("/nav-strip/settings", { durationSeconds: nextDuration });
      setSettings({ durationSeconds: nextDuration });
      setMessage("Nav strip timer updated.");
    } catch (requestError) {
      setMessage(
        requestError instanceof AdminApiError
          ? requestError.message
          : "Timer update failed",
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const nextText = form.text.trim();
    if (!nextText) {
      setMessage("Nav strip text is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        text: nextText.slice(0, TEXT_LIMIT),
        timer: {
          ...form.timer,
          durationMinutes: Math.min(43200, Math.max(1, Number(form.timer.durationMinutes || 60))),
          startAt:
            form.timer.mode === "one_time"
              ? fromDatetimeLocal(String(form.timer.startAt || ""))
              : "",
        },
      };

      if (editingId) {
        await adminApi.patch(`/nav-strip/${editingId}`, payload);
        setMessage("Nav strip text updated.");
      } else {
        await adminApi.post("/nav-strip", payload);
        setMessage("Nav strip text created.");
      }
      reset();
      load();
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

  const remove = async (id: string) => {
    if (!window.confirm("Delete this nav strip text?")) return;
    setMessage("");
    try {
      await adminApi.delete(`/nav-strip/${id}`);
      setMessage("Nav strip text deleted.");
      load();
    } catch (requestError) {
      setMessage(
        requestError instanceof AdminApiError
          ? requestError.message
          : "Delete failed",
      );
    }
  };

  if (loading) return <AdminLoadingState label="Loading nav strip..." />;
  if (error) return <AdminErrorState message={error} retry={load} />;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Nav strip"
        description="Manage the sticky rotating strip shown above the storefront navbar."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={16} />
            Add text
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h3 className="font-semibold text-slate-950">Strip settings</h3>
            <p className="mt-1 text-sm text-slate-500">
              One timer applies to every active strip text. Maximum 10 seconds.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                Timer seconds
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.durationSeconds}
                  onChange={(event) =>
                    setSettings({
                      durationSeconds: Math.min(10, Math.max(1, Number(event.target.value || 4))),
                    })
                  }
                  className="w-40 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </label>
              <button
                type="button"
                onClick={saveSettings}
                disabled={settingsSaving}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
              >
                <Save size={16} />
                {settingsSaving ? "Saving..." : "Save timer"}
              </button>
            </div>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
            {activeCount} active
          </span>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-slate-600">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-950">Strip texts</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item._id} className="grid gap-3 p-5 lg:grid-cols-[1fr_120px_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-950">{item.text}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.isActive ? "Visible" : "Hidden"}
                  </span>
                </div>
                {item.textHtml ? (
                  <p className="mt-1 truncate text-xs font-medium text-slate-400">
                    Rich text enabled
                  </p>
                ) : null}
                {item.timer?.enabled ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock3 size={13} />
                    {item.timer.mode === "one_time" ? "One-time" : "Loop"} timer,
                    {" "}
                    {item.timer.position === "start" ? "before text" : "after text"}
                  </p>
                ) : null}
              </div>
              <p className="self-center text-sm font-semibold text-slate-600">
                Order {item.order}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => edit(item)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-50"
                  aria-label="Edit nav strip text"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item._id)}
                  className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                  aria-label="Delete nav strip text"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!items.length ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500">
              No nav strip texts yet.
            </div>
          ) : null}
        </div>
      </section>

      {editorOpen ? (
        <NavStripEditorModal
          form={form}
          editing={Boolean(editingId)}
          saving={saving}
          onClose={reset}
          onSubmit={submit}
          onChange={setForm}
        />
      ) : null}
    </div>
  );
}

function NavStripEditorModal({
  form,
  editing,
  saving,
  onClose,
  onSubmit,
  onChange,
}: {
  form: NavStripForm;
  editing: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: (form: NavStripForm) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-950">
              {editing ? "Edit nav strip text" : "Create nav strip text"}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Select text to show the hyperlink option.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <RichNavStripEditor
            value={form.textHtml}
            onChange={(html, text) =>
              onChange({ ...form, textHtml: html, text: text.slice(0, TEXT_LIMIT) })
            }
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Order
              <input
                type="number"
                value={form.order}
                onChange={(event) => onChange({ ...form, order: Number(event.target.value || 0) })}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => onChange({ ...form, isActive: event.target.checked })}
              />
              Display
            </label>
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950 shadow-sm">
                  <Clock3 size={17} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-950">Countdown timer</h4>
                  <p className="text-xs font-medium text-slate-500">
                    Clock icon is shown by default when timer is enabled.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={form.timer.enabled}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      timer: { ...form.timer, enabled: event.target.checked },
                    })
                  }
                />
                Enable timer
              </label>
            </div>

            {form.timer.enabled ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                  Clock position
                  <select
                    value={form.timer.position}
                    onChange={(event) =>
                      onChange({
                        ...form,
                        timer: {
                          ...form.timer,
                          position: event.target.value as "start" | "end",
                        },
                      })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  >
                    <option value="start">Start of text</option>
                    <option value="end">End of text</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                  Timer type
                  <select
                    value={form.timer.mode}
                    onChange={(event) =>
                      onChange({
                        ...form,
                        timer: {
                          ...form.timer,
                          mode: event.target.value as "loop" | "one_time",
                        },
                      })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  >
                    <option value="loop">Loop</option>
                    <option value="one_time">One time</option>
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                  Timer duration
                  <input
                    type="number"
                    min={1}
                    max={43200}
                    value={form.timer.durationMinutes}
                    onChange={(event) =>
                      onChange({
                        ...form,
                        timer: {
                          ...form.timer,
                          durationMinutes: Math.min(43200, Math.max(1, Number(event.target.value || 60))),
                        },
                      })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                  <span className="text-xs text-slate-500">Duration is in minutes.</span>
                </label>

                {form.timer.mode === "one_time" ? (
                  <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                    Start date and time
                    <input
                      type="datetime-local"
                      value={String(form.timer.startAt || "")}
                      onChange={(event) =>
                        onChange({
                          ...form,
                          timer: { ...form.timer, startAt: event.target.value },
                        })
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {editing ? <Edit3 size={16} /> : <Plus size={16} />}
            {saving ? "Saving..." : editing ? "Update text" : "Create text"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RichNavStripEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string, text: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const linkEditRef = useRef<LinkEditState>({ anchor: null, selectedText: "" });
  const [selectionMenu, setSelectionMenu] = useState<{ top: number; left: number } | null>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<"add" | "edit">("add");
  const [hoverColor, setHoverColor] = useState("#f59e0b");
  const [linkHref, setLinkHref] = useState("");

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = () => {
    const html = ref.current?.innerHTML || "";
    const text = ref.current?.innerText.replace(/\s+/g, " ").trim() || "";
    onChange(html, text);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) {
      setSelectionMenu(null);
      return;
    }

    const selectedText = selection.toString().trim();
    const anchor = findClosestAnchor(
      range.commonAncestorContainer,
      ref.current,
    );

    if (!selectedText && !anchor) {
      setSelectionMenu(null);
      return;
    }

    rangeRef.current = range.cloneRange();
    linkEditRef.current = {
      anchor,
      selectedText: selectedText || anchor?.innerText.trim() || "",
    };
    const rect = range.getBoundingClientRect();
    const rootRect = ref.current.getBoundingClientRect();
    setSelectionMenu({
      top: rect.top - rootRect.top - 44,
      left: rect.left - rootRect.left + rect.width / 2,
    });
  };

  const restoreSelection = () => {
    const range = rangeRef.current;
    if (!range) return false;
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const applyCommand = (command: string) => {
    restoreSelection();
    document.execCommand(command, false);
    emitChange();
    saveSelection();
  };

  const openLinkPanel = () => {
    const anchor = linkEditRef.current.anchor;
    setLinkMode(anchor ? "edit" : "add");
    setLinkHref(anchor?.getAttribute("href") || "");
    setHoverColor(
      anchor?.style.getPropertyValue("--hover-color") ||
        anchor?.dataset.hoverColor ||
        "#f59e0b",
    );
    setLinkPanelOpen(true);
  };

  const applyLink = () => {
    const href = normalizeHref(linkHref);
    const color = normalizeHex(hoverColor);
    if (!href || !color) return;

    if (linkMode === "edit" && linkEditRef.current.anchor) {
      const anchor = linkEditRef.current.anchor;
      anchor.setAttribute("href", href);
      anchor.setAttribute("data-hover-color", "true");
      anchor.style.setProperty("--hover-color", color);
      emitChange();
      setLinkPanelOpen(false);
      setSelectionMenu(null);
      return;
    }

    if (!restoreSelection()) return;
    const range = rangeRef.current;
    if (!range || range.collapsed) return;

    const fragment = range.extractContents();
    const anchor = document.createElement("a");
    anchor.setAttribute("href", href);
    anchor.setAttribute("data-hover-color", "true");
    anchor.style.setProperty("--hover-color", color);
    anchor.appendChild(fragment);
    range.insertNode(anchor);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(anchor);
      selection.addRange(nextRange);
      rangeRef.current = nextRange.cloneRange();
    }

    emitChange();
    setLinkPanelOpen(false);
    setSelectionMenu(null);
  };

  const removeLink = () => {
    const anchor = linkEditRef.current.anchor;
    if (!anchor) return;
    const parent = anchor.parentNode;
    if (!parent) return;
    while (anchor.firstChild) {
      parent.insertBefore(anchor.firstChild, anchor);
    }
    parent.removeChild(anchor);
    emitChange();
    setLinkPanelOpen(false);
    setSelectionMenu(null);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
        <ToolbarButton label="B" onClick={() => applyCommand("bold")} />
        <ToolbarButton label="I" onClick={() => applyCommand("italic")} />
        <ToolbarButton label="U" onClick={() => applyCommand("underline")} />
        <ToolbarButton label="Clear" onClick={() => applyCommand("removeFormat")} />
      </div>

      <div className="relative">
        {selectionMenu && !linkPanelOpen ? (
          <div
            className="absolute right-3 top-3 z-20 rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
          >
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={openLinkPanel}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-100"
            >
              <Link2 size={14} />
              {linkEditRef.current.anchor ? "Edit hyperlink" : "Add hyperlink"}
            </button>
          </div>
        ) : null}

        {linkPanelOpen ? (
          <div className="absolute right-3 top-3 z-30 w-[min(360px,calc(100%-24px))] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">
                  {linkMode === "edit" ? "Edit hyperlink" : "Hyperlink"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {linkMode === "edit"
                    ? "Update or remove hyperlink from selected text."
                    : "Add URL and hover color for selected text."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkPanelOpen(false)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 grid gap-3">
              <input
                value={linkHref}
                onChange={(event) => setLinkHref(event.target.value)}
                placeholder="/sale or https://..."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={normalizeHex(hoverColor) || "#f59e0b"}
                  onChange={(event) => setHoverColor(event.target.value)}
                  className="h-9 w-10 cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  value={hoverColor}
                  onChange={(event) => setHoverColor(event.target.value)}
                  placeholder="#f59e0b"
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
                <button
                  type="button"
                  onClick={applyLink}
                  className="ml-auto rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-black"
                >
                  {linkMode === "edit" ? "Update link" : "Apply link"}
                </button>
              </div>
              {linkMode === "edit" ? (
                <button
                  type="button"
                  onClick={removeLink}
                  className="w-fit rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50"
                >
                  Remove hyperlink
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={() => window.setTimeout(saveSelection, 80)}
          className="min-h-32 rounded-b-lg px-3 py-3 text-sm font-semibold leading-7 text-slate-950 outline-none"
          data-placeholder="Write nav strip text. Select words to add hyperlink and hover color."
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>

      <style jsx>{`
        [contenteditable="true"]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
        }

        [contenteditable="true"] :global(a) {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-800 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

function findClosestAnchor(
  node: Node,
  root: HTMLElement | null,
): HTMLAnchorElement | null {
  let current: Node | null = node;

  while (current && current !== root) {
    if (current instanceof HTMLAnchorElement) return current;
    current = current.parentNode;
  }

  return null;
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed) || /^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }
  return "";
}

function normalizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
