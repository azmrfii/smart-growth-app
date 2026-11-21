import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "@/components/app-shell/Modal";
import { FieldError, fieldProps } from "@/components/app-shell/FieldError";
import { SmartGrowthAPI } from "@/lib/api-client";
import { validateEmail, validateOtp } from "@/lib/validation";

const RESEND_SECONDS = 60;

const inputClass =
  "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] outline-none placeholder:text-[#B3B3B3] focus:border-[#0891B2] aria-[invalid=true]:border-[#E7000B] aria-[invalid=true]:bg-red-50/40";

/**
 * Dialog aktivasi akun: pengguna memasukkan email + kode OTP 6 digit
 * yang dikirim ke emailnya saat akun dibuat oleh Super Admin.
 */
export function OtpActivationDialog({
  initialEmail = "",
  onClose,
  onActivated,
}: {
  initialEmail?: string;
  onClose: () => void;
  onActivated: (message: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<{ email?: string; otp?: string }>({});
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const found = { email: validateEmail(email), otp: validateOtp(otp) };
    setErrors(found);
    setServerError("");
    setInfo("");
    if (found.email || found.otp) return;

    setBusy(true);
    const res = await SmartGrowthAPI.activateAccount(email.trim(), otp.trim());
    setBusy(false);
    if (res.ok) {
      onActivated(res.data.message);
      return;
    }
    setErrors({ email: res.errors.email, otp: res.errors.otp });
    setServerError(res.errors.email || res.errors.otp ? "" : res.message);
  };

  const handleResend = async () => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    setServerError("");
    if (emailError || cooldown > 0) return;

    setBusy(true);
    const res = await SmartGrowthAPI.resendActivationOtp(email.trim());
    setBusy(false);
    if (res.ok) {
      setInfo(res.data.message);
      setCooldown(RESEND_SECONDS);
    } else {
      setErrors({ email: res.errors.email });
      setServerError(res.errors.email ? "" : res.message);
    }
  };

  return (
    <Modal
      title="Aktivasi Akun"
      description="Masukkan kode OTP 6 digit yang dikirim ke email Anda. Kode berlaku 10 menit."
      widthClass="max-w-[440px]"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#1E1E1E]">Email</span>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            className={inputClass}
            {...fieldProps("otp-email", errors.email)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((c) => ({ ...c, email: undefined }));
            }}
            placeholder="nama@domain.com"
          />
          <FieldError id="otp-email-error" message={errors.email} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#1E1E1E]">Kode OTP</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
            {...fieldProps("otp-code", errors.otp)}
            value={otp}
            onChange={(e) => {
              // hanya angka yang diterima
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              setErrors((c) => ({ ...c, otp: undefined }));
            }}
            placeholder="••••••"
          />
          <FieldError id="otp-code-error" message={errors.otp} />
        </label>

        {serverError ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#D4183D]">
            {serverError}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-xs text-[#0E7490]">{info}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={busy || cooldown > 0}
            className="text-xs font-semibold text-[#0891B2] hover:text-[#0E7490] disabled:text-[#9CA3AF]"
          >
            {cooldown > 0 ? `Kirim ulang dalam ${cooldown} dtk` : "Kirim ulang kode"}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-lg bg-[#0891B2] px-5 text-sm font-semibold text-white hover:bg-[#0E7490] disabled:opacity-70"
          >
            {busy ? "Memproses..." : "Aktifkan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
