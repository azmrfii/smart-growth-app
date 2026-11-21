/** Pesan error inline di bawah input. Diumumkan ke pembaca layar via role="alert". */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-[#E7000B]">
      {message}
    </p>
  );
}

/** Atribut aksesibilitas + gaya border untuk input yang bisa error. */
export function fieldProps(id: string, message?: string) {
  return {
    id,
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${id}-error` : undefined,
  } as const;
}
