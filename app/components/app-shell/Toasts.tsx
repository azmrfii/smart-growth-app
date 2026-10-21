import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { useAppStore } from "@/lib/nutrition-store";

export function Toasts() {
  const notices = useAppStore((state) => state.notices);
  const dismissNotice = useAppStore((state) => state.dismissNotice);

  if (notices.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[300px] flex-col gap-3"
    >
      {notices.map((notice) => (
        <div
          key={notice.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#757575] bg-white p-4 shadow-lg"
        >
          <IconInfoCircle size={20} stroke={2} color="#1E1E1E" className="shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1E1E1E]">{notice.title}</p>
            <p className="text-sm text-[#1E1E1E]">{notice.body}</p>
          </div>
          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            aria-label="Tutup notifikasi"
            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
          >
            <IconX size={20} stroke={1.6} color="#2C2C2C" />
          </button>
        </div>
      ))}
    </div>
  );
}
