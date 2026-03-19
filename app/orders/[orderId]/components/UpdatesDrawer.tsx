"use client";

type Props = {
  open: boolean;
  visible: boolean;
  steps: string[];
  currentStep: number;
  lineHeight: number;
  progressHeight: number;
  cancelled: boolean;
  onClose: () => void;
};

export default function UpdatesDrawer({
  open,
  visible,
  steps,
  currentStep,
  lineHeight,
  progressHeight,
  cancelled,
  onClose,
}: Props) {
  const progressColor = cancelled ? "bg-red-600" : "bg-black";
  const activeDot = cancelled ? "bg-red-600 border-red-600" : "bg-black border-black";
  const inactiveDot = cancelled ? "bg-white border-red-300" : "bg-white border-black/30";
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <button
        type="button"
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Close updates"
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[88%] max-w-xs bg-white border-l border-black/15 p-5 grid gap-4 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Order Updates</div>
          <button type="button" className="btn btn-ghost px-3 py-1" onClick={onClose}>
            Close
          </button>
        </div>
        {/* {cancelled && <div className="text-xs text-red-600">Order cancelled</div>} */}
        <div className="relative pl-6">
          {!cancelled && (
            <>
              <div
                className="absolute left-[32px] top-[10px] w-[2px] bg-black/20"
                style={{ height: `${lineHeight}px` }}
              />
              <div
                className={`absolute left-[32px] top-[10px] w-[3px] ${progressColor}`}
                style={{ height: `${progressHeight}px` }}
              />
            </>
          )}
          <div className="grid gap-4">
            {cancelled ? (
              <div className="relative flex items-start gap-3 min-h-[56px]">
                <span className="mt-[2px] w-4 h-4 rounded-full border bg-red-600 border-red-600" />
                <div className="text-sm">
                  <div className="font-semibold text-red-600">Cancelled</div>
                  <div className="text-xs text-[var(--muted)]">Order closed</div>
                </div>
              </div>
            ) : (
              steps.map((step, idx) => {
                const active = idx <= currentStep;
                return (
                  <div key={step} className="relative flex items-start gap-3 min-h-[56px]">
                    <span
                      className={`mt-[2px] w-4 h-4 rounded-full border ${active ? activeDot : inactiveDot}`}
                    />
                    <div className="text-sm">
                      <div className={active ? "font-semibold" : "text-[var(--muted)]"}>{step}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {active ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
