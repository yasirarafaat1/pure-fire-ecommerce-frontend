"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserToken, setUserAuth } from "../utils/auth";

type Step = "email" | "otp";

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
  const authBase = "/api/auth";

  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => {
      setCooldown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) setNextPath(next);
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
      setError("Email required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${authBase}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setInfo("OTP sent. Please check your email.");
      setStep("otp");
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setInfo("");
    const emailVal = email.trim().toLowerCase();
    if (!emailVal || otp.trim().length !== 4) {
      setError("Enter valid email and 4-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${authBase}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.message || "OTP verification failed");
      }
      setUserAuth(data.token || "", data.email || emailVal);
      window.dispatchEvent(new Event("auth:changed"));
      setInfo("Login successful.");
      router.replace(nextPath || "/profile");
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-10">
      <form
        className="w-full max-w-md border border-black/20 rounded-[5px] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "email") sendOtp();
          else verifyOtp();
        }}
      >
        <h1 className="text-xl font-semibold">Login / Register</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Enter your email to receive 4-digit OTP.
        </p>

        <div className="grid gap-4 mt-5">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === "otp"}
            />
          </div>

          {step === "otp" && (
            <div>
              <label className="label">OTP</label>
              <input
                className="input tracking-[6px] text-center"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-700">{info}</div>}

          {step === "email" ? (
            <div className="grid gap-2">
              <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <a href="/" className="btn btn-ghost w-full">
                Back to home
              </a>
            </div>
          ) : (
            <div className="grid gap-2">
              <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                className="btn btn-ghost w-full"
                onClick={sendOtp}
                disabled={loading || cooldown > 0}
                type="button"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
              <button
                className="btn w-full"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
                type="button"
              >
                Change Email
              </button>
              <a href="/" className="btn btn-ghost w-full">
                Back to home
              </a>
            </div>
          )}
        </div>
      </form>
    </main>
  );
}
