import { IconX } from "@tabler/icons-react";
import { useEffect, type ReactNode } from "react";

type ModalProps = {
  title: string;
  description?: string;
  widthClass?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({
  title,
  description,
  widthClass = "max-w-[634px]",
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-[10px] border border-black/10 bg-white p-6 shadow-xl ${widthClass}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0A0A0A]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-[#717182]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-black/5"
          >
            <IconX size={16} stroke={1.6} color="#0A0A0A" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} description={message} widthClass="max-w-[512px]" onClose={onCancel}>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-black/10 bg-white px-4 text-sm text-[#0A0A0A] hover:bg-black/5"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 rounded-lg bg-[#E7000B] px-4 text-sm text-white hover:bg-[#C10007]"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
