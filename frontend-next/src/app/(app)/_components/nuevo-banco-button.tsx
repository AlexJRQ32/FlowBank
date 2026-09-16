"use client";

// Legacy parity: "Nuevo banco" button opens the inline BancoFormModal.
import { useState } from "react";
import BancoFormModal from "./banco-form-modal";

export function NuevoBancoButton({
  className,
  label = "Nuevo banco",
  icon,
}: {
  className?: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {icon}
        {label}
      </button>
      <BancoFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default NuevoBancoButton;
