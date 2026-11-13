"use client";

// Port of legacy BancoFormModal.tsx: "Registrar banco" modal, single nombre
// field, Cancelar/Guardar footer, success toast + close, error inline.
import { useActionState, useEffect, useRef } from "react";
import Modal from "@/components/ui/modal";
import formStyles from "@/components/ui/modal-form.module.scss";
import { useToast } from "@/components/ui/toast";
import { createBancoAction, type BancoState } from "@/app/(app)/bancos/actions";

export function BancoFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(
    createBancoAction,
    {} as BancoState,
  );
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (state.ok && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Banco registrado", `${state.ok} se guardo correctamente.`);
      onClose();
    }
    if (state.error) {
      toast.error("No se pudo guardar el banco", state.error);
    }
    void state.ok;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps -- toast helpers are stable

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar banco"
      footer={
        <>
          <button type="button" className={`${formStyles["btn"]} ${formStyles["btn--ghost"]}`} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="banco-form"
            className={`${formStyles["btn"]} ${formStyles["btn--primary"]}`}
            disabled={pending}
          >
            {pending ? "Guardando..." : "Guardar banco"}
          </button>
        </>
      }
    >
      <form id="banco-form" className={formStyles["form"]} action={formAction} noValidate>
        <div className={formStyles["field"]}>
          <label htmlFor="bf-nombre">Nombre del banco</label>
          <input
            id="bf-nombre"
            name="nombre"
            type="text"
            placeholder="Ej: Banco Cathay"
            autoFocus
            autoComplete="off"
          />
        </div>
        {state.error && (
          <p className={formStyles["error"]} role="alert">
            {state.error}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default BancoFormModal;
