"use client";

import { useState } from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { setUserAuth } from "../../../utils/auth";
import type { LoginOtpAssistantCard } from "../types";

type LoginResponse = {
  status?: boolean;
  message?: string;
  token?: string;
  email?: string;
};

export default function LoginOtpCard({ card }: { card: LoginOtpAssistantCard }) {
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    const emailValue = email.trim().toLowerCase();
    setError("");
    setMessage("");
    if (!emailValue) {
      setError("Email required.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = (await response.json()) as LoginResponse;
      if (!response.ok || data.status === false) {
        throw new Error(data.message || "Failed to send OTP");
      }
      setMessage("OTP sent. Please check your email.");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const emailValue = email.trim().toLowerCase();
    const otpValue = otp.trim();
    setError("");
    setMessage("");
    if (!emailValue || otpValue.length !== 4) {
      setError("Enter valid email and 4-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, otp: otpValue }),
      });
      const data = (await response.json()) as LoginResponse;
      if (!response.ok || data.status === false || !data.token) {
        throw new Error(data.message || "OTP verification failed");
      }
      setUserAuth(data.token, data.email || emailValue);
      window.dispatchEvent(new Event("auth:changed"));
      setMessage("Login successful.");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[7px] border border-black/10 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-white">
          {step === "done" ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{card.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{card.message}</p>
        </div>
      </div>

      {step !== "done" ? (
        <div className="mt-3 grid gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Email</span>
            <div className="flex items-center gap-2 rounded-[6px] border border-black/10 bg-slate-50 px-3">
              <Mail size={14} className="text-slate-400" />
              <input
                type="email"
                value={email}
                disabled={loading || step === "otp"}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={card.emailPlaceholder}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-70"
              />
            </div>
          </label>

          {step === "otp" ? (
            <label className="grid gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">OTP</span>
              <input
                inputMode="numeric"
                maxLength={4}
                value={otp}
                disabled={loading}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={card.otpPlaceholder}
                className="h-10 rounded-[6px] border border-black/10 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {step === "email" ? (
              <button type="button" disabled={loading} onClick={sendOtp} className="assistant-auth-button">
                {loading ? "Sending..." : card.sendLabel}
              </button>
            ) : (
              <>
                <button type="button" disabled={loading} onClick={verifyOtp} className="assistant-auth-button">
                  {loading ? "Verifying..." : card.verifyLabel}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                  className="assistant-auth-button-secondary"
                >
                  {card.changeEmailLabel}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-xs font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}

      <style jsx>{`
        .assistant-auth-button,
        .assistant-auth-button-secondary {
          min-height: 38px;
          border-radius: 6px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 900;
          transition:
            transform 160ms ease,
            opacity 160ms ease;
        }

        .assistant-auth-button {
          background: #020617;
          color: #ffffff;
        }

        .assistant-auth-button-secondary {
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #0f172a;
        }

        .assistant-auth-button:hover,
        .assistant-auth-button-secondary:hover {
          transform: translateY(-1px);
        }

        .assistant-auth-button:disabled,
        .assistant-auth-button-secondary:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          transform: none;
        }
      `}</style>
    </div>
  );
}
