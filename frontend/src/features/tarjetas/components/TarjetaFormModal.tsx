import { useCallback, useEffect, useState, type FormEvent } from "react";
import Modal from "../../../components/ui/Modal/Modal";
import CreditCardPreview from "../../../components/ui/CreditCardPreview/CreditCardPreview";
import { useToast } from "../../../components/ui/Toast/useToast";
import type { Banco, TarjetaInput } from "../../../types";
import "./TarjetaFormModal.scss";

interface TarjetaFormModalProps {
  open: boolean;
  onClose: () => void;
  bancos: Banco[];
  onSave: (data: TarjetaInput) => Promise<void>;
}

const TIPOS = ["Credito", "Debito"];

export function TarjetaFormModal({ open, onClose, bancos, onSave }: TarjetaFormModalProps) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [bancoId, setBancoId] = useState(bancos[0]?.id ?? 0);
  const [ultimosCuatroDigitos, setUltimosCuatroDigitos] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [titular, setTitular] = useState("");
  const [diaCorte, setDiaCorte] = useState(0);
  const [diaPago, setDiaPago] = useState(0);
  const [limiteCredito, setLimiteCredito] = useState("");
  const [saving, setSaving] = useState(false);

  const bancoSeleccionado = bancos.find((b) => b.id === bancoId);

  const resetForm = useCallback(() => {
    setNombre("");
    setBancoId(bancos[0]?.id ?? 0);
    setUltimosCuatroDigitos("");
    setTipo(TIPOS[0]);
    setTitular("");
    setDiaCorte(0);
    setDiaPago(0);
    setLimiteCredito("");
  }, [bancos]);

  // Resetear el formulario cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (ultimosCuatroDigitos.replace(/\D/g, "").length !== 4) {
      toast.error("Datos invalidos", "Ingresa los ultimos 4 digitos de la tarjeta.");
      return;
    }

    if (!diaCorte || !diaPago) {
      toast.error("Datos invalidos", "Indica el dia de corte y el dia de pago.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombre: nombre.trim() || "Tarjeta",
        bancoId,
        ultimosCuatroDigitos: ultimosCuatroDigitos.replace(/\D/g, ""),
        tipo,
        diaCorte,
        diaPago,
        limiteCredito: Number(limiteCredito) || 0,
      });
      toast.success("Tarjeta registrada", `${nombre.trim() || "Tarjeta"} se guardo correctamente.`);
      resetForm();
      onClose();
    } catch (err: unknown) {
      toast.error(
        "No se pudo guardar la tarjeta",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar tarjeta"
      footer={
        <>
          <button type="button" className="btn-modal btn-modal--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="tarjeta-form" className="btn-modal btn-modal--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar tarjeta"}
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
      />

      <form id="tarjeta-form" className="tf-form" onSubmit={handleSubmit} noValidate>
        <div className="tf-form__row">
          <div className="tf-form__field">
            <label htmlFor="tf-nombre">Nombre de la tarjeta</label>
            <input
              id="tf-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Visa BCR"
              autoComplete="off"
            />
          </div>
          <div className="tf-form__field">
            <label htmlFor="tf-banco">Banco</label>
            <select id="tf-banco" value={bancoId} onChange={(e) => setBancoId(Number(e.target.value))}>
              {bancos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tf-form__row">
          <div className="tf-form__field">
            <label htmlFor="tf-digitos">Ultimos 4 digitos</label>
            <input
              id="tf-digitos"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={ultimosCuatroDigitos}
              onChange={(e) => setUltimosCuatroDigitos(e.target.value.replace(/\D/g, ""))}
              placeholder="2841"
              autoComplete="off"
            />
          </div>
          <div className="tf-form__field">
            <label htmlFor="tf-tipo">Tipo</label>
            <select id="tf-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tf-form__field">
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

        <div className="tf-form__row">
          <div className="tf-form__field">
            <label htmlFor="tf-corte">Dia de corte</label>
            <input
              id="tf-corte"
              type="number"
              min={1}
              max={31}
              value={diaCorte || ""}
              onChange={(e) => setDiaCorte(Number(e.target.value))}
              placeholder="15"
            />
          </div>
          <div className="tf-form__field">
            <label htmlFor="tf-pago">Dia de pago</label>
            <input
              id="tf-pago"
              type="number"
              min={1}
              max={31}
              value={diaPago || ""}
              onChange={(e) => setDiaPago(Number(e.target.value))}
              placeholder="02"
            />
          </div>
          <div className="tf-form__field">
            <label htmlFor="tf-limite">Limite de credito</label>
            <input
              id="tf-limite"
              type="number"
              min={0}
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

      </form>
    </Modal>
  );
}

export default TarjetaFormModal;
