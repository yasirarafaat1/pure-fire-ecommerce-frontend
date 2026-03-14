"use client";

type Props = {
  existingImages: any[];
  newImages: File[];
  setNewImages: (files: File[]) => void;
  existingVideo?: any;
  newVideo?: File | null;
  setNewVideo: (file: File | null) => void;
  onRemoveExistingImage: (url: string) => void;
  onRemoveExistingVideo: () => void;
};

export default function StepMedia({
  existingImages,
  newImages,
  setNewImages,
  existingVideo,
  newVideo,
  setNewVideo,
  onRemoveExistingImage,
  onRemoveExistingVideo,
}: Props) {
  const normalizeImages = (arr: any[]) =>
    (arr || [])
      .map((i) =>
        typeof i === "string" ? i : i?.secure_url || i?.url || i?.path || ""
      )
      .filter(Boolean);

  const normalizedExisting = normalizeImages(existingImages);
  const imageItems = [
    ...normalizedExisting.map((url, idx) => ({ url, kind: "existing" as const, idx })),
    ...newImages.map((file, idx) => ({ url: URL.createObjectURL(file), kind: "new" as const, idx })),
  ];

  const normalizeVideo = (v: any) =>
    typeof v === "string" ? v : v?.secure_url || v?.url || v?.path || "";

  const currentVideoUrl = newVideo
    ? URL.createObjectURL(newVideo)
    : normalizeVideo(existingVideo);
  const videoLabel = newVideo?.name || normalizeVideo(existingVideo) || "none";

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="grid gap-3">
        <label className="label">Hero image + gallery (5-10)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewImages(Array.from(e.target.files || []))}
          className="input"
        />
        <div className="text-xs text-[var(--muted)]">
          First image is cover. Current files: {imageItems.length}.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {imageItems.map(({ url, kind, idx }) => (
            <div key={`${kind}-${idx}`} className="relative border border-black/5 rounded overflow-hidden group">
              <img src={url} alt="product" className="w-full aspect-[4/3] object-cover" />
              <span className="absolute bottom-1 left-1 text-[10px] px-2 py-[2px] rounded bg-white/80 border border-black/10">
                {kind === "new" ? "New" : "Saved"}
              </span>
              <button
                type="button"
                className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                onClick={() => {
                  if (kind === "new") {
                    setNewImages(newImages.filter((_, i) => i !== idx));
                  } else {
                    onRemoveExistingImage(url);
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6 18 20H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <label className="label">Product video (exactly 1 for publish)</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setNewVideo(e.target.files?.[0] || null)}
          className="input"
        />
        <div className="text-xs text-[var(--muted)]">MP4/MOV recommended. Max 100MB.</div>
        {currentVideoUrl && (
          <div className="border border-black/5 rounded overflow-hidden bg-black/5 relative group">
            <video
              key={currentVideoUrl}
              src={currentVideoUrl}
              controls
              muted
              className="w-full aspect-video"
            />
            <div className="px-3 py-2 text-xs text-[var(--muted)] truncate">{videoLabel}</div>
            <button
              type="button"
              className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100"
              onClick={() => {
                if (newVideo) {
                  setNewVideo(null);
                } else {
                  onRemoveExistingVideo();
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6 18 20H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
