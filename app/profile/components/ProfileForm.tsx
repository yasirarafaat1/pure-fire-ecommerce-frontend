"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { FaFemale, FaMale, FaUser } from "react-icons/fa";
import { getUserToken, handleAuthExpiredResponse } from "../../utils/auth";

type Profile = {
  email: string;
  name: string;
  gender: string;
};

type GenderOption = {
  key: string;
  label: string;
  icon: ReactElement;
  helper: string;
};

const genderOptions: GenderOption[] = [
  {
    key: "male",
    label: "Male",
    icon: <FaMale />,
    helper: "Male avatar",
  },
  {
    key: "female",
    label: "Female",
    icon: <FaFemale />,
    helper: "Female avatar",
  },
  {
    key: "other",
    label: "Other",
    icon: <FaUser />,
    helper: "Default avatar",
  },
];

const getToken = () => getUserToken();

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatGender = (value: string) => {
  if (!value) return "Not set";
  return value.replace(/^\w/, (char) => char.toUpperCase());
};

export default function ProfileForm({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [profile, setProfile] = useState<Profile>({
    email: "",
    name: "",
    gender: "",
  });
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
          headers: {
            "Content-Type": "application/json",
            "x-user-token": getToken(),
          },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (handleAuthExpiredResponse(res, data)) return;

        if (!res.ok || !data.status) {
          throw new Error(data.message || "Failed to load profile.");
        }

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
      } catch (err: unknown) {
        if (active) {
          setError(errorMessage(err, "Failed to load profile."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [email]);

  const avatarIcon = useMemo(() => {
    const gender = profile.gender.toLowerCase();

    if (gender === "male") return <FaMale />;
    if (gender === "female") return <FaFemale />;

    return <FaUser />;
  }, [profile.gender]);

  const normalizedName = draft.name.trim();
  const hasChanges =
    normalizedName !== profile.name || draft.gender !== profile.gender;

  const selectedGender =
    genderOptions.find((item) => item.key === (editing ? draft.gender : profile.gender)) ||
    null;

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
        headers: {
          "Content-Type": "application/json",
          "x-user-token": getToken(),
        },
        body: JSON.stringify({
          email: profile.email,
          name: normalizedName,
          gender: draft.gender,
        }),
      });

      const data = await res.json();

      if (handleAuthExpiredResponse(res, data)) return;

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to save profile.");
      }

      const next = {
        email: data.profile?.email || profile.email,
        name: data.profile?.name || draft.name,
        gender: data.profile?.gender || draft.gender,
      };

      setProfile(next);
      setDraft({ name: next.name, gender: next.gender });
      setEditing(false);
      setInfo("Profile updated successfully.");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft({ name: profile.name, gender: profile.gender });
    setEditing(false);
    setError("");
    setInfo("");
  };

  const startEdit = () => {
    setDraft({ name: profile.name, gender: profile.gender });
    setEditing(true);
    setError("");
    setInfo("");
  };

  if (loading) {
    return (
      <div className="grid gap-5">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-[4px] bg-slate-100" />
            <div className="grid flex-1 gap-2">
              <div className="h-4 w-40 animate-pulse rounded-[4px] bg-slate-100" />
              <div className="h-3 w-56 animate-pulse rounded-[4px] bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[4px] border border-slate-200 bg-white p-4">
          <div className="grid gap-2">
            <div className="h-3 w-24 animate-pulse rounded-[4px] bg-slate-100" />
            <div className="h-11 animate-pulse rounded-[4px] border border-slate-100 bg-slate-50" />
          </div>

          <div className="grid gap-2">
            <div className="h-3 w-16 animate-pulse rounded-[4px] bg-slate-100" />
            <div className="h-11 animate-pulse rounded-[4px] border border-slate-100 bg-slate-50" />
          </div>

          <div className="grid gap-2">
            <div className="h-3 w-20 animate-pulse rounded-[4px] bg-slate-100" />
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="h-12 animate-pulse rounded-[4px] bg-slate-100" />
              <div className="h-12 animate-pulse rounded-[4px] bg-slate-100" />
              <div className="h-12 animate-pulse rounded-[4px] bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        if (editing && hasChanges && !saving) {
          void saveProfile();
        }
      }}
    >
      <section className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[4px] border border-slate-200 bg-slate-950 text-2xl text-white">
              {avatarIcon}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Account Profile
              </p>

              <h2 className="mt-1 truncate text-xl font-black tracking-[-0.03em] text-slate-950">
                {profile.name || "Complete your profile"}
              </h2>

              <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
            {selectedGender ? selectedGender.label : "Gender not set"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Personal Details
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Keep your name and profile preferences updated for a better account
              experience.
            </p>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            {editing ? (
              <>
                <button
                  className="h-10 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={saving || !hasChanges}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  className="h-10 rounded-[4px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="h-10 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-black active:scale-[0.99]"
                type="button"
                onClick={startEdit}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-slate-800">
              Full Name
            </span>

            <input
              className="h-11 rounded-[4px] border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 read-only:cursor-default read-only:bg-slate-50 read-only:text-slate-600"
              placeholder="Enter your full name"
              value={editing ? draft.name : profile.name}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }));
                setError("");
                setInfo("");
              }}
              readOnly={!editing}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-slate-800">
              Email Address
            </span>

            <input
              className="h-11 rounded-[4px] border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600 outline-none"
              placeholder="you@email.com"
              value={profile.email}
              readOnly
            />

            <span className="text-xs font-semibold text-slate-500">
              Email is linked to your login OTP.
            </span>
          </label>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-black text-slate-800">Gender</span>

          {editing ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {genderOptions.map((gender) => {
                const activeGender = draft.gender === gender.key;

                return (
                  <button
                    key={gender.key}
                    type="button"
                    className={`flex items-center gap-3 rounded-[4px] border px-3 py-3 text-left transition ${activeGender
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-950 hover:bg-slate-50"
                      }`}
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        gender: gender.key,
                      }));
                      setError("");
                      setInfo("");
                    }}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[4px] text-lg ${activeGender
                          ? "bg-white text-slate-950"
                          : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      {gender.icon}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-black ${activeGender ? "text-white" : "text-slate-950"
                          }`}
                      >
                        {gender.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs font-semibold ${activeGender ? "text-white/65" : "text-slate-500"
                          }`}
                      >
                        {gender.helper}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-[4px] bg-white text-lg text-slate-700">
                {avatarIcon}
              </span>

              <div>
                <p className="text-sm font-black text-slate-950">
                  {formatGender(profile.gender)}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Avatar updates based on selected gender.
                </p>
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="rounded-[4px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {info}
          </div>
        ) : null}
      </section>
    </form>
  );
}
