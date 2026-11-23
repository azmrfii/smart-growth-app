
import {
  IconArrowRight,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconLock,
  IconStack2,
  IconToolsKitchen2,
  IconTrendingUp,
  IconUser,
  IconUserShield,
} from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";

import { useAppStore } from "@/lib/nutrition-store";
import { USERS, type UserCredential } from "@/lib/users";
import { AuthController } from "@/lib/auth-controller";
import { OtpActivationDialog } from "@/components/app-shell/OtpActivation";
import { FieldError, fieldProps } from "@/components/app-shell/FieldError";
import { hasErrors, validateLoginForm, type FieldErrors, type LoginFields } from "@/lib/validation";

export function meta() {
  return [{ title: "Masuk - Sistem Manajemen Gizi Anak" }];
}

export default function MasukRoute() {
  const navigate = useNavigate();
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const currentUser = useAppStore((state) => state.currentUser);

  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFields>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activation, setActivation] = useState<{ email: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;
  if (isLoggedIn) {
    return <Navigate to={currentUser ? AuthController.redirectDashboard(currentUser) : "/kelola-pengguna"} replace />;
  }

  const handleSelectUser = (user: UserCredential) => {
    setUsername(user.username);
    setPassword(user.password);
    setError("");
  };

  const showErrorMessage = (message: string) => {
    setError(message);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const errors = validateLoginForm({ username, password });
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      setError("");
      return;
    }

    setSubmitting(true);
    const result = await AuthController.login(username, password);
    setSubmitting(false);

    if (result.status === "success") {
      navigate(AuthController.redirectDashboard(result.user), { replace: true });
      return;
    }
    if (result.status === "needs-activation") {
      setActivation({ email: result.email });
      return;
    }
    setFieldErrors(result.fieldErrors);
    showErrorMessage(result.message);
  };

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="relative flex min-h-[460px] flex-1 flex-col items-center justify-center overflow-hidden p-8 sm:p-12 lg:min-h-screen lg:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login_bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0891B2]/90 via-[#067A97]/92 to-[#0E7490]/96 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#0891B2]/40" />

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-lg backdrop-blur-md">
            <IconStack2 size={32} stroke={2} className="text-white" />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
            Sistem Manajemen
            <br />
            Gizi Anak
          </h1>

          <p className="mt-4 max-w-md text-sm text-white/90 sm:text-base leading-relaxed font-normal">
            Platform profesional untuk monitoring dan analisis status gizi anak berbasis standar
            WHO Z-Score
          </p>

          <div className="mt-10 grid w-full grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/15 p-3.5 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.02]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-xs">
                <IconChartBar size={20} stroke={2} className="text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">
                Analisis Z-Score
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/15 p-3.5 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.02]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-xs">
                <IconToolsKitchen2 size={20} stroke={2} className="text-amber-200" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">
                Rekomendasi Menu
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/25 bg-white/15 p-3.5 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.02]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-xs">
                <IconTrendingUp size={20} stroke={2} className="text-rose-300" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">
                Laporan Detail
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#EEF4F8] p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(8,112,184,0.08)] sm:p-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] sm:text-[26px]">
              Selamat Datang
            </h2>
            <p className="mt-1.5 text-sm text-[#717182]">Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={submitLogin} noValidate className="mt-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center rounded-xl bg-[#F3F4F6] border border-transparent transition-all focus-within:border-[#0891B2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0891B2]/20">
                <IconUser size={18} stroke={1.75} className="ml-3.5 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  autoComplete="username"
                  maxLength={30}
                  {...fieldProps("login-username", fieldErrors.username)}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                    setNotice("");
                    setFieldErrors((f) => ({ ...f, username: undefined }));
                  }}
                  placeholder="Masukkan username"
                  aria-label="Username"
                  className="h-12 w-full bg-transparent pl-3 pr-4 text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF] outline-none"
                />
              </div>
              <FieldError id="login-username-error" message={fieldErrors.username} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center rounded-xl bg-[#F3F4F6] border border-transparent transition-all focus-within:border-[#0891B2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0891B2]/20">
                <IconLock size={18} stroke={1.75} className="ml-3.5 text-[#9CA3AF] pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={72}
                  {...fieldProps("login-password", fieldErrors.password)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setFieldErrors((f) => ({ ...f, password: undefined }));
                  }}
                  placeholder="Masukkan password"
                  aria-label="Password"
                  className="h-12 w-full bg-transparent pl-3 pr-11 text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  className="absolute right-3.5 p-1 text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              <FieldError id="login-password-error" message={fieldErrors.password} />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#D4183D]">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                {notice}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex h-12 disabled:opacity-70 w-full items-center justify-center gap-2 rounded-xl bg-[#0891B2] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(8,145,178,0.38)] transition-all hover:bg-[#0E7490] hover:shadow-[0_6px_20px_0_rgba(8,145,178,0.48)] active:scale-[0.99]"
            >
              <span>{submitting ? "Memverifikasi..." : "Masuk"}</span>
              <IconArrowRight size={18} stroke={2.5} />
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[#717182]">
            Akun baru?{" "}
            <button
              type="button"
              onClick={() => setActivation({ email: "" })}
              className="font-semibold text-[#0891B2] hover:text-[#0E7490]"
            >
              Aktivasi dengan kode OTP
            </button>
          </p>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDemoUsers(!showDemoUsers)}
              className="flex w-full items-center justify-between py-1 text-xs font-semibold text-[#0891B2] hover:text-[#0E7490] transition-colors"
            >
              <span>Akun Demo (klik untuk mengisi form)</span>
              <IconChevronDown
                size={16}
                className={`transition-transform ${showDemoUsers ? "rotate-180" : ""}`}
              />
            </button>

            {showDemoUsers ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="flex flex-col items-start rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 text-left transition hover:border-[#0891B2] hover:bg-cyan-50/50"
                  >
                    <span className="text-xs font-bold text-[#0A0A0A]">{user.name}</span>
                    <span className="text-[11px] font-medium text-[#0891B2]">{user.role}</span>
                    <span className="mt-1 text-[10px] text-[#717182]">
                      @{user.username}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8 text-center text-xs text-[#9CA3AF] space-y-0.5">
            <p>© 2025 Sistem Manajemen Gizi Anak</p>
            <p>Platform Monitoring Gizi Berbasis WHO Z-Score</p>
          </div>
        </div>
      </div>

      {submitting ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-sm"
        >
          <span className="size-10 animate-spin rounded-full border-4 border-[#0891B2]/25 border-t-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0E7490]">Memverifikasi kredensial...</span>
        </div>
      ) : null}

      {activation ? (
        <OtpActivationDialog
          initialEmail={activation.email}
          onClose={() => setActivation(null)}
          onActivated={(message) => {
            setActivation(null);
            setError("");
            setNotice(message);
          }}
        />
      ) : null}
    </main>
  );
}
