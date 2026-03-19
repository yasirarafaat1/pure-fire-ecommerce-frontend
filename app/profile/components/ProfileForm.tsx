"use client";

import { useEffect, useMemo, useState } from "react";
import { FaFemale, FaMale, FaUser } from "react-icons/fa";
import { getUserToken } from "../../utils/auth";

type Profile = { email: string; name: string; gender: string };

const getToken = () => getUserToken();

export default function ProfileForm({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [profile, setProfile] = useState<Profile>({ email: "", name: "", gender: "" });
  const [draft, setDraft] = useState({ name: "", gender: "" });
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    if (!email) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/user/get-user-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-token": getToken() },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok || !data.status) throw new Error(data.message || "Failed to load profile");
        if (active) {
          const next = {
            email: data.profile?.email || email,
            name: data.profile?.name || "",
            gender: data.profile?.gender || "",
          };
          setProfile(next);
          setDraft({ name: next.name, gender: next.gender });
          setEditing(!(next.name || next.gender));
        }
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load profile");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [email]);

  const avatarIcon = useMemo(() => {
    const g = profile.gender.toLowerCase();
    if (g === "male") return <FaMale />;
    if (g === "female") return <FaFemale />;
    return <FaUser />;
  }, [profile.gender]);

  const normalizedName = draft.name.trim();
  const hasChanges = normalizedName !== profile.name || draft.gender !== profile.gender;

  const saveProfile = async () => {
    if (!profile.email) {
      setError("Email missing. Please login again.");
      return;
    }
    if (!hasChanges) {
      setInfo("No changes to save.");
      return;
    }
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/user/update-user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": getToken() },
        body: JSON.stringify({ email: profile.email, name: normalizedName, gender: draft.gender }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Failed to save");
      const next = {
        email: data.profile?.email || profile.email,
        name: data.profile?.name || draft.name,
        gender: data.profile?.gender || draft.gender,
      };
      setProfile(next);
      setDraft({ name: next.name, gender: next.gender });
      setEditing(false);
      setInfo("Profile updated.");
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (editing && hasChanges && !saving) saveProfile();
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border border-black/20 flex items-center justify-center text-xl">
          {avatarIcon}
        </div>
        <div className="text-sm text-[var(--muted)]">Avatar updates by gender.</div>
      </div>

      <div>
        <label className="label">Full Name</label>
        <input
          className="input"
          placeholder="Your name"
          value={editing ? draft.name : profile.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          readOnly={!editing}
        />
      </div>

      <div>
        <label className="label">Email</label>
        <input className="input" placeholder="you@email.com" value={profile.email} readOnly />
      </div>

      <div>
        <label className="label">Gender</label>
        {editing ? (
          <div className="flex gap-2">
            {["male", "female", "other"].map((g) => {
              const activeGender = draft.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  className={`px-3 py-2 border rounded-[5px] text-sm ${
                    activeGender ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                  }`}
                  onClick={() => setDraft((p) => ({ ...p, gender: g }))}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm font-medium">
            {(profile.gender || "Not set").replace(/^\w/, (c) => c.toUpperCase())}
          </div>
        )}
      </div>

      {loading && <div className="text-sm text-[var(--muted)]">Loading profile...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {info && <div className="text-sm text-green-700">{info}</div>}

      <div className="flex gap-2">
        {editing ? (
          <>
            <button className="btn btn-primary" type="submit" disabled={saving || !hasChanges}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setDraft({ name: profile.name, gender: profile.gender });
                setEditing(false);
                setError("");
                setInfo("");
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setDraft({ name: profile.name, gender: profile.gender });
              setEditing(true);
              setError("");
              setInfo("");
            }}
          >
            Edit Profile
          </button>
        )}
      </div>
    </form>
  );
}
