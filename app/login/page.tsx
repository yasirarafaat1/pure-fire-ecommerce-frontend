"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserToken, setUserAuth } from "../utils/auth";

type Step = "email" | "otp";

const authBase = "/api/auth";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isSafeNextPath(value: string | null): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  return true;
}

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [nextPath, setNextPath] = useState("/profile");

  useEffect(() => {
    if (!cooldown) return;

    const id = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const next = new URLSearchParams(window.location.search).get("next");

    if (isSafeNextPath(next)) {
      setNextPath(next);
    }
  }, []);

  useEffect(() => {
    const token = getUserToken();

    if (token) {
      router.replace("/profile");
    }
  }, [router]);

  const sendOtp = async () => {
    setError("");
    setInfo("");

    const emailVal = email.trim().toLowerCase();

    if (!emailVal) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${authBase}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || "Could not send OTP.");
      }

      setEmail(emailVal);
      setInfo("OTP sent successfully. Please check your email inbox.");
      setStep("otp");
      setCooldown(30);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send OTP."));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setInfo("");

    const emailVal = email.trim().toLowerCase();
    const otpVal = otp.trim();

    if (!emailVal) {
      setError("Please enter your email address.");
      return;
    }

    if (otpVal.length !== 4) {
      setError("Please enter the 4-digit OTP sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${authBase}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, otp: otpVal }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setUserAuth(data.token || "", data.email || emailVal);

      window.dispatchEvent(new Event("auth:changed"));
      window.dispatchEvent(new Event("auth:updated"));

      setInfo("Login successful. Redirecting...");

      router.replace(nextPath || "/profile");
    } catch (err) {
      setError(getErrorMessage(err, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    if (step === "email") {
      void sendOtp();
      return;
    }

    void verifyOtp();
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
    setInfo("");
    setCooldown(0);
  };

  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="grid h-80 w-80 place-items-center">
                <img
                  src="/Shopping.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="">

                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Login faster with email OTP
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  Access your profile, orders, wishlist and checkout details
                  securely without creating a password.
                </p>
              </div>

              <div className="mt-6 grid w-full grid-cols-3 gap-3">
                <div className="rounded-[4px] border border-slate-900/10 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-black text-slate-950">Orders</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Track purchases
                  </p>
                </div>

                <div className="rounded-[4px] border border-slate-900/10 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-black text-slate-950">Wishlist</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Save products
                  </p>
                </div>

                <div className="rounded-[4px] border border-slate-900/10 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-black text-slate-950">Profile</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Manage details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <form
            className="overflow-hidden rounded-[4px] border border-slate-900/10 bg-white shadow-sm"
            onSubmit={onSubmit}
          >
            <div className="border-b border-slate-900/10 bg-slate-950 px-5 py-5 text-white sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                {step === "email" ? "Login / Register" : "Verify OTP"}
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                {step === "email"
                  ? "Access your account"
                  : "Check your email"}
              </h1>

              <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
                {step === "email"
                  ? "Enter your email address. We will send a 4-digit OTP for secure login."
                  : `We sent a 4-digit OTP to ${email}. Enter it below to continue.`}
              </p>
            </div>

            <div className="grid gap-5 px-5 py-5 sm:px-6">
              <div className="grid gap-2">
                <label className="text-sm font-black text-slate-800">
                  Email address
                </label>

                <input
                  type="email"
                  className="h-11 rounded-[4px] border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    setInfo("");
                  }}
                  disabled={step === "otp" || loading}
                  autoComplete="email"
                />

                {step === "otp" ? (
                  <button
                    type="button"
                    onClick={changeEmail}
                    disabled={loading}
                    className="w-fit text-xs font-black text-slate-600 underline underline-offset-4 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Change email address
                  </button>
                ) : null}
              </div>

              {step === "otp" ? (
                <div className="grid gap-2">
                  <label className="text-sm font-black text-slate-800">
                    4-digit OTP
                  </label>

                  <input
                    className="h-12 rounded-[4px] border border-slate-300 bg-white px-3 text-center text-xl font-black tracking-[10px] text-slate-950 outline-none transition placeholder:text-slate-300 hover:border-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                    placeholder="0000"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 4));
                      setError("");
                      setInfo("");
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={loading}
                  />

                  <p className="text-xs font-semibold leading-5 text-slate-500">
                    OTP is valid for a short time. Check spam folder if you do
                    not see it in your inbox.
                  </p>
                </div>
              ) : null}

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

              {step === "email" ? (
                <div className="grid gap-2">
                  <button
                    className="h-11 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <a
                    href="/"
                    className="grid h-11 place-items-center rounded-[4px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    Back to home
                  </a>
                </div>
              ) : (
                <div className="grid gap-2">
                  <button
                    className="h-11 rounded-[4px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>

                  <button
                    className="h-11 rounded-[4px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void sendOtp()}
                    disabled={loading || cooldown > 0}
                    type="button"
                  >
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </button>

                  <button
                    className="h-11 rounded-[4px] border border-slate-300 bg-slate-50 px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={changeEmail}
                    disabled={loading}
                    type="button"
                  >
                    Use another email
                  </button>

                  <a
                    href="/"
                    className="grid h-11 place-items-center rounded-[4px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    Back to home
                  </a>
                </div>
              )}

              <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                By continuing, you can access your account, orders and saved
                preferences securely.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
