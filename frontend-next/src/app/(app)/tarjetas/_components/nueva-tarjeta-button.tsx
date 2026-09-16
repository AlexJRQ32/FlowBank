"use client";

// Legacy parity: the "Nueva tarjeta" button opens the inline modal (from
// /tarjetas and from the dashboard quick actions) instead of navigating.
// The full /tarjetas/nueva page stays available for direct links.
import { useState } from "react";
import { TarjetaFormModal, type BancoOpcion } from "./tarjeta-form-modal";

export function NuevaTarjetaButton({
  bancos,
  tipoCambioVenta,
  className,
  label = "Nueva tarjeta",
  icon,
}: {
  bancos: BancoOpcion[];
  tipoCambioVenta?: number;
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
      <TarjetaFormModal
        open={open}
        onClose={() => setOpen(false)}
        bancos={bancos}
        tipoCambioVenta={tipoCambioVenta}
      />
    </>
  );
}

export default NuevaTarjetaButton;
