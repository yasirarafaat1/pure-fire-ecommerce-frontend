"use client";

type Props = {
  steps: string[];
  currentStep: number;
  progressPct: number;
  cancelled: boolean;
  courierName?: string;
  etaDays?: number;
  etaDate?: string;
  statusNote?: string;
  onOpenUpdates: () => void;
};

export default function DeliveryProgress({
  steps,
  currentStep,
  progressPct,
  cancelled,
  courierName,
  etaDays,
  etaDate,
  statusNote,
  onOpenUpdates,
}: Props) {
  const progressColor = cancelled ? "bg-red-600" : "bg-black";
  const activeDot = cancelled ? "bg-red-600 border-red-600" : "bg-black border-black";
  const inactiveDot = cancelled ? "bg-white border-red-300" : "bg-white border-black/30";
  const showEta = !!(courierName || etaDays || etaDate);
  return (
    <div className="border-b border-t border-black/15 p-5 grid gap-4">
      <div className="text-sm font-semibold">Delivery progress</div>
      <div className="sm:hidden text-xs text-[var(--muted)]">
        Status: {cancelled ? "Cancelled" : steps[Math.min(currentStep, steps.length - 1)]}
      </div>
      {statusNote && <div className="text-xs text-red-600">{statusNote}</div>}
      {showEta && (
        <div className="text-xs text-[var(--muted)]">
          Delivery service:{" "}
          <span className="text-black">{courierName || "Not assigned"}</span>
          {/* {etaDays ? ` | ETA ${etaDays} days` : ""} */}
          {etaDate ? ` | By ${etaDate}` : ""}
        </div>
      )}
      <div className="grid gap-3">
        {!cancelled && (
          <>
            <div className="hidden sm:flex items-center justify-between text-xs text-[var(--muted)]">
              {steps.map((step) => (
                <span key={step} className="text-center w-full">
                  {step}
                </span>
              ))}
            </div>
            <div className="hidden sm:block relative h-1 bg-black/10 rounded">
              <div
                className={`absolute left-0 top-0 h-1 rounded ${progressColor}`}
                style={{ width: `${progressPct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between">
                {steps.map((step, idx) => {
                  const active = idx <= currentStep;
                  return (
                    <span
                      key={step}
                      className={`w-3 h-3 rounded-full border ${active ? activeDot : inactiveDot}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="sm:hidden h-1 bg-black/10 rounded overflow-hidden">
              <div className={`h-full ${progressColor}`} style={{ width: `${progressPct}%` }} />
            </div>
          </>
        )}

        {cancelled && (
          <div className="grid gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-red-600">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              Cancelled
            </div>
            <div className="hidden sm:block h-1 bg-black/10 rounded overflow-hidden">
              <div className="h-full bg-red-600 w-full" />
            </div>
            <div className="sm:hidden h-1 bg-black/10 rounded overflow-hidden">
              <div className="h-full bg-red-600 w-full" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-center pt-5 sm:hidden">
          <button type="button" className="btn btn-ghost px-3 py-2 text-xs w-fit" onClick={onOpenUpdates}>
            See all updates
          </button>
        </div>
      </div>
      {/* {cancelled && <div className="text-xs text-red-600">This order was cancelled.</div>} */}
    </div>
  );
}
