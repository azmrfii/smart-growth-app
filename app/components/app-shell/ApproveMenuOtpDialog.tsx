import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Modal } from "@/components/app-shell/Modal";
import { FieldError, fieldProps } from "@/components/app-shell/FieldError";
import { SmartGrowthAPI } from "@/lib/api-client";
import { validateOtp } from "@/lib/validation";

const RESEND_SECONDS = 60;

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

type Phase = "sending" | "ready" | "locked" | "expired" | "offline" | "error";

/**
 * Konfirmasi approve menu dengan OTP email.
 * Saat dibuka, kode langsung diminta ke server; kode berlaku 5 menit dan
 * maksimal 3 kali salah (aturan ditegakkan backend).
 */
export function ApproveMenuOtpDialog({
  menuId,
  menuTitle,
  onClose,
  onApproved,
  onOffline,
}: {
  menuId: string;
  menuTitle: string;
  onClose: () => void;
  onApproved: (message: string) => void;
  /** Server tidak bisa dihubungi: biarkan halaman memakai mode demo lokal. */
  onOffline: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("sending");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expiresLeft, setExpiresLeft] = useState(0);
  const [resendLeft, setResendLeft] = useState(0);
  const requested = useRef(false);

  const requestOtp = useCallback(async () => {
    setPhase("sending");
    setServerError("");
    setOtp("");
    setOtpError(undefined);
    const res = await SmartGrowthAPI.requestApproveMenuOtp(menuId);
    if (res.ok) {
      setMaskedEmail(res.data.email);
      setExpiresLeft(res.data.expiresIn);
      setResendLeft(RESEND_SECONDS);
      setPhase("ready");
      return;
    }
    if (res.status === 0) {
      onOffline();
      return;
    }
    if (res.status === 429 && res.body?.retryAfter) {
      // Kode yang dikirim < 60 detik lalu masih berlaku: pakai kode itu.
      setResendLeft(Number(res.body.retryAfter));
      setPhase("ready");
      setServerError(`${res.message} Gunakan kode yang sudah ada di email Anda.`);
      return;
    }
    setPhase("error");
    setServerError(res.message);
  }, [menuId, onOffline]);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void requestOtp();
  }, [requestOtp]);

  // Hitung mundur masa berlaku & jeda kirim ulang.
  useEffect(() => {
    if (phase !== "ready" && phase !== "locked" && phase !== "expired") return;
    const timer = setInterval(() => {
      setExpiresLeft((s) => Math.max(0, s - 1));
      setResendLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "ready" && expiresLeft === 0 && maskedEmail) {
      setPhase("expired");
      setServerError("Kode OTP sudah kedaluwarsa. Minta kode baru.");
    }
  }, [phase, expiresLeft, maskedEmail]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || phase !== "ready") return;
    const error = validateOtp(otp);
    setOtpError(error);
    setServerError("");
    if (error) return;

    setBusy(true);
    const res = await SmartGrowthAPI.approveMenu(menuId, otp.trim());
    setBusy(false);
    if (res.ok) {
      onApproved(res.data.message);
      return;
    }
    if (res.status === 0) {
      setServerError("Server tidak dapat dihubungi. Coba lagi.");
      return;
    }
    const code = res.body?.code;
    if (code === "LOCKED") setPhase("locked");
    else if (code === "EXPIRED" || code === "NONE") setPhase("expired");
    if (res.errors.otp) setOtpError(res.errors.otp);
    else setServerError(res.message);
    setOtp("");
  };

  const canResend = resendLeft === 0 && !busy && phase !== "sending";

  return (
    <Modal
      title="Konfirmasi Approve Menu"
      description={`Menyetujui "${menuTitle}" akan langsung mendistribusikannya ke Admin Dapur MBG.`}
      widthClass="max-w-[460px]"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {phase === "sending" ? (
          <p className="rounded-lg bg-[#F3F4F6] p-3 text-sm text-[#4A5565]">Mengirim kode OTP ke email Anda...</p>
        ) : maskedEmail ? (
          <p className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-[#0E7490]">
            Kode OTP 6 digit telah dikirim ke <strong>{maskedEmail}</strong>.{" "}
            {phase === "ready" ? (
              <>
                Berlaku <strong data-testid="otp-countdown">{formatTime(expiresLeft)}</strong> lagi, maksimal 3 kali salah.
              </>
            ) : null}
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#1E1E1E]">Kode OTP</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={phase !== "ready"}
            className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-center font-mono text-lg tracking-[0.5em] outline-none placeholder:text-[#B3B3B3] focus:border-[#0891B2] disabled:bg-[#F3F4F6] aria-[invalid=true]:border-[#E7000B] aria-[invalid=true]:bg-red-50/40"
            {...fieldProps("approve-otp", otpError)}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              setOtpError(undefined);
            }}
            placeholder="••••••"
          />
          <FieldError id="approve-otp-error" message={otpError} />
        </label>

        {serverError ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#D4183D]">
            {serverError}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void requestOtp()}
            disabled={!canResend}
            className="text-xs font-semibold text-[#0891B2] hover:text-[#0E7490] disabled:text-[#9CA3AF]"
          >
            {resendLeft > 0 ? `Kirim kode baru dalam ${resendLeft} dtk` : "Kirim kode baru"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-black/10 bg-white px-4 text-sm text-[#0A0A0A] hover:bg-black/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy || phase !== "ready"}
              className="h-10 rounded-lg bg-[#0891B2] px-5 text-sm font-semibold text-white hover:bg-[#0E7490] disabled:opacity-60"
            >
              {busy ? "Memeriksa..." : "Approve"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
