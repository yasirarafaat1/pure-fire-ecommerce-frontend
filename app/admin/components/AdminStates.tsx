import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function AdminLoadingState({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="grid min-h-56 place-items-center text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <LoaderCircle className="animate-spin" size={18} />
        {label}
      </div>
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-56 place-items-center px-6 text-center">
      <div>
        <Inbox className="mx-auto text-slate-400" size={28} />
        <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function AdminErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="grid min-h-56 place-items-center px-6 text-center">
      <div>
        <AlertCircle className="mx-auto text-red-500" size={28} />
        <h3 className="mt-3 font-semibold text-slate-900">Unable to load this page</h3>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        <button className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={retry}>
          Try again
        </button>
      </div>
    </div>
  );
}
