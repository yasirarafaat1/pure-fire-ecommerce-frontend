"use client";

export default function SettingsSection() {
  return (
    <div className="grid gap-3">
      <label className="flex items-center justify-between border border-black/15 rounded-[5px] p-3 text-sm">
        <span>Order updates</span>
        <input type="checkbox" className="accent-black" defaultChecked />
      </label>
      <label className="flex items-center justify-between border border-black/15 rounded-[5px] p-3 text-sm">
        <span>Marketing emails</span>
        <input type="checkbox" className="accent-black" />
      </label>
    </div>
  );
}
