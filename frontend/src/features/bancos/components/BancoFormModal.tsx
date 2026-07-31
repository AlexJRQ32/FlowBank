import { useState, type FormEvent } from "react";
import Modal from "../../../components/ui/Modal/Modal";
import { useToast } from "../../../components/ui/Toast/useToast";
import "./BancoFormModal.scss";

interface BancoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string }) => Promise<void>;
}

export function BancoFormModal({ open, onClose, onSave }: BancoFormModalProps) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("Datos invalidos", "Ingresa el nombre del banco.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ nombre: nombre.trim() });
      toast.success("Banco registrado", `${nombre.trim()} se guardo correctamente.`);
      setNombre("");
      onClose();
    } catch (err: unknown) {
      toast.error(
        "No se pudo guardar el banco",
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
      title="Registrar banco"
      footer={
        <>
          <button type="button" className="btn-modal btn-modal--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="banco-form" className="btn-modal btn-modal--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar banco"}
          </button>
        </>
      }
    >
      <form id="banco-form" className="bf-form" onSubmit={handleSubmit} noValidate>
        <div className="bf-form__field">
          <label htmlFor="bf-nombre">Nombre del banco</label>
          <input
            id="bf-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Banco Nacional"
            autoFocus
            autoComplete="off"
          />
        </div>
      </form>
    </Modal>
  );
}

export default BancoFormModal;
