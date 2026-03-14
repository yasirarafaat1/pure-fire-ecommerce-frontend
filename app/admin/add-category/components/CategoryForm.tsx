"use client";

import { useEffect, useState } from "react";

type CategoryNode = {
  _id: string;
  name: string;
  children?: CategoryNode[];
};

const API_BASE = "/api/admin";

export default function CategoryForm() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<CategoryNode | null>(null);
  const [selectedSub, setSelectedSub] = useState<CategoryNode | null>(null);
  const [selectedChild, setSelectedChild] = useState<CategoryNode | null>(null);
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newRoot, setNewRoot] = useState("");
  const [newChild, setNewChild] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories/tree`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Backend unavailable");
      const data = await res.json();
      if (data.status) setTree(data.categories || []);
    } catch (error: any) {
      setMessage(error.message || "Failed to reach backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleCreate = async () => {
    const name = newRoot.trim();
    if (!name) return setMessage("Enter category name.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMessage("Saved.");
      setNewRoot("");
      fetchTree();
    } catch (err: any) {
      setMessage(err.message || "Failed to save. Is backend running on 5000?");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChild = async () => {
    const parent = selectedChild || selectedSub || selectedRoot;
    if (!parent) return setMessage("Select a category/sub-category first.");
    const depth = selectedChild ? 2 : selectedSub ? 1 : 0;
    if (depth >= 2) return setMessage("Sub-child cannot have further children.");
    const name = newChild.trim();
    if (!name) return setMessage("Enter sub category name.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parent._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMessage("Sub category added.");
      setNewChild("");
      fetchTree();
    } catch (err: any) {
      setMessage(err.message || "Failed to add sub category.");
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    const target = selectedChild || selectedSub || selectedRoot;
    if (!target) return setMessage("Select a category to rename.");
    if (!renameValue.trim()) return setMessage("Enter new name.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/categories/${target._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rename failed");
      setMessage("Renamed.");
      setRenameValue("");
      setSelectedChild(null);
      setSelectedSub(null);
      setSelectedRoot(null);
      fetchTree();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid gap-6 lg:grid-cols-2 items-start">
      <section className="card p-6 sticky top-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Step 1</p>
            <h2 className="text-xl font-semibold">Create category chain</h2>
          </div>
          {loading && <div className="pill">Saving…</div>}
        </header>
        <div className="grid gap-4">
          <div>
            <label className="label">Add root category</label>
            <input
              className="input"
              value={newRoot}
              onChange={(e) => setNewRoot(e.target.value)}
              placeholder="Mens"
            />
            <button className="btn btn-primary w-full mt-2" onClick={handleCreate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add root
            </button>
          </div>
          <div>
            <label className="label">Add sub category to selected</label>
            <input
              className="input"
              value={newChild}
              onChange={(e) => setNewChild(e.target.value)}
              placeholder="Jeans / Shoes / Accessories"
            />
            <button
              className="btn btn-ghost w-full mt-2"
              onClick={handleCreateChild}
              disabled={!selectedRoot && !selectedSub && !selectedChild}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add under "{selectedChild?.name || selectedSub?.name || selectedRoot?.name || "select a category"}"
            </button>
            {selectedChild && (
              <p className="text-xs text-[var(--muted)]">Sub-child is the last level; cannot add deeper.</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="label">Rename selected</label>
            <input
              className="input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name"
            />
            <button className="btn btn-ghost" onClick={handleRename}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              Rename
            </button>
            <p className="text-xs text-[var(--muted)]">Edit names to adjust taxonomy.</p>
          </div>
          {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        </div>
      </section>

      <section className="card p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overview</h2>
        </header>
        <div className="grid gap-3">
          {tree.map((root) => (
            <div key={root._id} className="border border-black/10 rounded-[4px]">
              <button
                className={`w-full text-left px-4 py-3 flex justify-between items-center ${
                  expandedRoot === root._id ? "bg-black/5" : ""
                }`}
                onClick={() => {
                  const next = expandedRoot === root._id ? null : root._id;
                  setExpandedRoot(next);
                  setExpandedSub(null);
                  setSelectedRoot(root);
                  setSelectedSub(null);
                  setSelectedChild(null);
                  setRenameValue(root.name);
                }}
              >
                <span>{root.name}</span>
                <span className="text-xs text-[var(--muted)]">{expandedRoot === root._id ? "▲" : "▼"}</span>
              </button>
              {expandedRoot === root._id && (
                <div className="px-4 pb-3">
                  {root.children?.map((sub) => (
                    <div key={sub._id} className="mt-2 border border-black/10 rounded-[4px]">
                      <button
                        className={`w-full text-left px-3 py-2 flex justify-between items-center ${
                          expandedSub === sub._id ? "bg-black/5" : ""
                        }`}
                        onClick={() => {
                          const next = expandedSub === sub._id ? null : sub._id;
                          setExpandedSub(next);
                          setSelectedRoot(root);
                          setSelectedSub(sub);
                          setSelectedChild(null);
                          setRenameValue(sub.name);
                        }}
                      >
                        <span>{sub.name}</span>
                        <span className="text-xs text-[var(--muted)]">{expandedSub === sub._id ? "▲" : "▼"}</span>
                      </button>
                      {expandedSub === sub._id && (
                        <div className="px-3 pb-2">
                          {sub.children?.map((child) => (
                            <button
                              key={child._id}
                              className={`input mt-2 text-left ${
                                selectedChild?._id === child._id ? "border-[var(--accent)]" : ""
                              }`}
                              onClick={() => {
                                setSelectedRoot(root);
                                setSelectedSub(sub);
                                setSelectedChild(child);
                                setRenameValue(child.name);
                              }}
                            >
                              {child.name}
                            </button>
                          ))}
                          {!sub.children?.length && (
                            <p className="text-xs text-[var(--muted)] mt-2">No sub-child yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {!root.children?.length && (
                    <p className="text-xs text-[var(--muted)] mt-2">No sub categories yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
