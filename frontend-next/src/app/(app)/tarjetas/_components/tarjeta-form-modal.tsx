"use client";

// Port of legacy TarjetaFormModal.tsx: inline "Registrar tarjeta" modal with
// the live CreditCardPreview, form id tarjeta-form (footer submit via form
// attribute), Cancelar/Guardar footer, success toast + close, error kept
// inline. Submit runs createTarjetaModalAction (no redirect on success).
import { useActionState, useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/modal";
import CreditCardPreview from "@/components/ui/credit-card-preview";
import formStyles from "@/components/ui/modal-form.module.scss";
import { useToast } from "@/components/ui/toast";
import { createTarjetaModalAction, type TarjetaState } from "../actions";

const TIPOS = ["Credito", "Debito"];

export interface BancoOpcion {
  id: string;
  nombre: string;
}

export function TarjetaFormModal({
  open,
  onClose,
  bancos,
  tipoCambioVenta,
}: {
  open: boolean;
  onClose: () => void;
  bancos: BancoOpcion[];
  tipoCambioVenta?: number;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(
    createTarjetaModalAction,
    {} as TarjetaState,
  );
  const [nombre, setNombre] = useState("");
  const [bancoId, setBancoId] = useState(bancos[0]?.id ?? "");
  const [ultimosCuatroDigitos, setUltimosCuatroDigitos] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [titular, setTitular] = useState("");
  const [diaCorte, setDiaCorte] = useState(0);
  const [diaPago, setDiaPago] = useState(0);
  const [limiteCredito, setLimiteCredito] = useState("");
  const toastShownRef = useRef(false);

  const bancoSeleccionado = bancos.find((b) => b.id === bancoId);
  const limiteUsd = Number(limiteCredito) || 0;
  const limiteColones =
    tipoCambioVenta && limiteUsd > 0 ? Math.round(limiteUsd * tipoCambioVenta) : null;

  // Legacy UX: success toast + close (never shown twice for the same submit).
  useEffect(() => {
    if (state.ok && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(
        "Tarjeta registrada",
        `${nombre.trim() || "Tarjeta"} se guardo correctamente.`,
      );
      onClose();
    }
    if (state.error) {
      toast.error(
        "No se pudo guardar la tarjeta",
        state.error ?? "Intenta de nuevo.",
      );
    }
    void state.ok;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps -- toast helpers are stable

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar tarjeta"
      footer={
        <>
          <button type="button" className={`${formStyles["btn"]} ${formStyles["btn--ghost"]}`} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="tarjeta-form"
            className={`${formStyles["btn"]} ${formStyles["btn--primary"]}`}
            disabled={pending}
          >
            {pending ? "Guardando..." : "Guardar tarjeta"}
          </button>
        </>
      }
    >
      <CreditCardPreview
        nombre={nombre}
        banco={bancoSeleccionado?.nombre ?? ""}
        ultimosDigitos={ultimosCuatroDigitos}
        titular={titular}
        diaCorte={diaCorte}
        diaPago={diaPago}
        limiteUsd={limiteUsd}
        limiteColones={limiteColones}
      />

      <form id="tarjeta-form" className={formStyles["form"]} action={formAction} noValidate>
        {state.error && !open ? null : null}
        <div className={formStyles["row"]}>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-nombre">Nombre de la tarjeta</label>
            <input
              id="tf-nombre"
              name="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Visa BCR"
              autoComplete="off"
            />
          </div>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-banco">Banco</label>
            <select
              id="tf-banco"
              name="banco_id"
              value={bancoId}
              onChange={(e) => setBancoId(e.target.value)}
            >
              {bancos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={formStyles["row"]}>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-digitos">Ultimos 4 digitos</label>
            <input
              id="tf-digitos"
              name="ultimos_cuatro_digitos"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={ultimosCuatroDigitos}
              onChange={(e) => setUltimosCuatroDigitos(e.target.value.replace(/\D/g, ""))}
              placeholder="2841"
              autoComplete="off"
            />
          </div>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-tipo">Tipo</label>
            <select id="tf-tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={formStyles["field"]}>
          <label htmlFor="tf-titular">Titular</label>
          <input
            id="tf-titular"
            type="text"
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            placeholder="Nombre del titular"
            autoComplete="off"
          />
        </div>

        <div className={formStyles["row"]}>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-corte">Dia de corte</label>
            <input
              id="tf-corte"
              name="dia_corte"
              type="number"
              min={1}
              max={31}
              value={diaCorte || ""}
              onChange={(e) => setDiaCorte(Number(e.target.value))}
              placeholder="15"
            />
          </div>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-pago">Dia de pago</label>
            <input
              id="tf-pago"
              name="dia_pago"
              type="number"
              min={1}
              max={31}
              value={diaPago || ""}
              onChange={(e) => setDiaPago(Number(e.target.value))}
              placeholder="02"
            />
          </div>
          <div className={formStyles["field"]}>
            <label htmlFor="tf-limite">Limite de credito (USD)</label>
            <input
              id="tf-limite"
              name="limite_credito"
              type="number"
              min={0}
              step="0.01"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              placeholder="0.00"
            />
            {limiteColones !== null ? (
              <small className={formStyles["hint"]}>
                ≈ ₡{limiteColones.toLocaleString("es-CR")} (USD {limiteUsd.toFixed(2)})
              </small>
            ) : null}
          </div>
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

export default TarjetaFormModal;
