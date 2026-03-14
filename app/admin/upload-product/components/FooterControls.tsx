"use client";

type Props = {
  active: number;
  categorySelected: boolean;
  canNext?: boolean;
  canPublish?: boolean;
  canDraft?: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onDraft: () => void;
  onPublish: () => void;
  onRequireCategory: () => void;
  busyAction?: "draft" | "published" | null;
};

const Icon = {
  back: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  next: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  save: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};

export default function FooterControls({
  active,
  categorySelected,
  canNext = true,
  canPublish = true,
  canDraft = true,
  onBack,
  onNext,
  onCancel,
  onDraft,
  onPublish,
  onRequireCategory,
  busyAction = null,
}: Props) {
  const isBusy = !!busyAction;
  const savingLabel =
    busyAction === "draft" ? "Saving draft..." : busyAction === "published" ? "Publishing..." : "";

  return (
    <footer className="mt-6 flex flex-wrap gap-3 justify-end">
      {active > 1 && (
        <button className="btn btn-ghost" onClick={onBack} disabled={isBusy}>
          {Icon.back} Back
        </button>
      )}

      {active === 1 && (
        <button
          className="btn btn-primary"
          disabled={!categorySelected || isBusy}
          onClick={() => (categorySelected ? onNext() : onRequireCategory())}
        >
          Next {Icon.next}
        </button>
      )}

      {active === 2 && (
        <>
          {/* <button className="btn btn-ghost" onClick={onCancel} disabled={isBusy}>
            Cancel
          </button> */}
          {canDraft && (
            <button className="btn btn-ghost" onClick={onDraft} disabled={isBusy}>
              {busyAction === "draft" ? <span className="spinner" /> : Icon.save}{" "}
              {busyAction === "draft" ? "Saving draft…" : "Save draft"}
            </button>
          )}
          <button className="btn btn-primary" onClick={onNext} disabled={isBusy || !canNext}>
            Next {Icon.next}
          </button>
        </>
      )}

      {active === 3 && (
        <>
          {canDraft && (
            <button className="btn btn-ghost" onClick={onDraft} disabled={isBusy}>
              {busyAction === "draft" ? <span className="spinner" /> : Icon.save}{" "}
              {busyAction === "draft" ? "Saving draft…" : "Save draft"}
            </button>
          )}
          <button className="btn btn-primary" onClick={onPublish} disabled={isBusy || !canPublish}>
            {busyAction === "published" ? <span className="spinner" /> : Icon.check}{" "}
            {busyAction === "published" ? "Publishing…" : "Publish"}
          </button>
        </>
      )}

    </footer>
  );
}
