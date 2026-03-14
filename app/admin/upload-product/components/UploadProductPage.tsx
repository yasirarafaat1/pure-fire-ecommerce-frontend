"use client";

import { useEffect, useState } from "react";
import ProductWizard from "./ProductWizard";

const API_BASE = "/api/admin";

type ProductListItem = any;

const IconEdit = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const IconTrash = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6 18 20H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function UploadProductPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [drafts, setDrafts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [confirmClose, setConfirmClose] = useState<null | "delete">(null);
  const [draftToDelete, setDraftToDelete] = useState<number | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/drafts`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to fetch drafts");
      setDrafts(data.drafts || []);
    } catch (err: any) {
      setMessage("Could not load drafts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const deleteDraft = async (id: number) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/drafts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error("Delete failed");
      fetchDrafts();
    } catch (err: any) {
      setMessage("Failed to delete draft. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Products</p>
          <h1 className="text-2xl font-semibold">Upload products</h1>
        </div>
        <div className="flex gap-2">
          {showWizard ? null : (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowWizard(true); }}>
              Add product
            </button>
          )}
          {showWizard && (
            <button className="btn btn-ghost" onClick={() => { setShowWizard(false); setEditing(null); }}>
              Close wizard
            </button>
          )}
        </div>
      </header>

      {showWizard && (
        <ProductWizard
          product={editing}
          onSaved={() => { setShowWizard(false); setEditing(null); fetchDrafts(); }}
          onClose={() => {
            // auto-save draft for new product when closing wizard without saving/publishing
            if (!editing) {
              window.dispatchEvent(new CustomEvent("wizard-save-draft"));
              setTimeout(fetchDrafts, 800);
            }
            setShowWizard(false);
            setEditing(null);
          }}
        />
      )}

      {!showWizard && (
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Drafts</h2>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="spinner" />
                <span>Loading drafts…</span>
              </div>
            )}
          </div>
          {drafts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No drafts yet.</p>
          ) : (
            <div className="grid gap-3">
              {drafts.map((draft) => (
                <div key={draft.draft_id} className="flex items-center justify-between border border-black/10 rounded-[5px] px-4 py-3">
                  <div>
                    <p className="font-semibold">{draft.name || draft.title || "Untitled"} (#{draft.draft_id})</p>
                    <p className="text-xs text-[var(--muted)]">status: draft</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost"
                      onClick={() => { setEditing(draft); setShowWizard(true); }}
                    >
                      <IconEdit /> Edit
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => { setDraftToDelete(draft.draft_id); setConfirmClose("delete"); }}
                    >
                      <IconTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
        </section>
      )}

      {confirmClose === "delete" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete draft?</h3>
            <p className="text-sm text-[var(--muted)]">This cannot be undone.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirmClose(null)}>✖ No</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (draftToDelete) await deleteDraft(draftToDelete);
                  setDraftToDelete(null);
                  setConfirmClose(null);
                }}
              >
                <IconTrash size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
