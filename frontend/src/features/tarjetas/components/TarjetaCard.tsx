import { motion } from "motion/react";
import { TrashIcon } from "../../../components/icons";
import { formatoColones, formatoDolares } from "../../../lib/currency";
import type { Tarjeta } from "../../../types";
import "./TarjetaCard.scss";

interface TarjetaCardProps {
  tarjeta: Tarjeta;
  bancoNombre?: string;
  onDelete: (id: number, nombre: string) => void;
}

function formatNumber(digitos: string): string {
  const clean = digitos.replace(/\D/g, "").padStart(4, "•");
  return `•••• •••• •••• ${clean}`;
}

export function TarjetaCard({ tarjeta, bancoNombre, onDelete }: TarjetaCardProps) {
  return (
    <li className="tarjeta-card">
      <motion.div
        className="tarjeta-card__plastico"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 18, mass: 0.7 }}
        whileHover={{ y: -4 }}
      >
        <motion.div
          className="tarjeta-card__shine"
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.8 }}
        />

        <div className="tarjeta-card__top">
          <motion.div
            className="tarjeta-card__chip"
            animate={{ boxShadow: [
              "0 0 0 0 rgba(212, 175, 55, 0)",
              "0 0 16px 2px rgba(212, 175, 55, 0.4)",
              "0 0 0 0 rgba(212, 175, 55, 0)",
            ] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="tarjeta-card__brand">
            <img src="/logo.svg" alt="" />
            <span>{bancoNombre || "Banco"}</span>
          </div>
          <button
            type="button"
            className="tarjeta-card__delete"
            aria-label={`Eliminar ${tarjeta.nombre}`}
            onClick={() => onDelete(tarjeta.id, tarjeta.nombre)}
          >
            <TrashIcon size={16} />
          </button>
        </div>

        <motion.div
          className="tarjeta-card__number"
          animate={{ opacity: [0.8, 1, 0.8], letterSpacing: ["2px", "3px", "2px"] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {formatNumber(tarjeta.ultimosCuatroDigitos)}
        </motion.div>
        <div className="tarjeta-card__alias">{tarjeta.nombre}</div>

        <div className="tarjeta-card__mid">
          <div className="tarjeta-card__dates">
            <div className="tarjeta-card__field">
              <span>Corte</span>
              <strong>Dia {tarjeta.diaCorte}</strong>
            </div>
            <div className="tarjeta-card__field">
              <span>Pago</span>
              <strong>Dia {tarjeta.diaPago}</strong>
            </div>
          </div>
          <span className="tarjeta-card__tipo">{tarjeta.tipo}</span>
        </div>

        <div className="tarjeta-card__info">
          <div className="tarjeta-card__fila">
            <small>Limite disponible</small>
            <div className="tarjeta-card__valores">
              <strong>₡{formatoColones(tarjeta.limiteDisponibleColones)}</strong>
              <span>|</span>
              <strong>${formatoDolares(tarjeta.limiteDisponibleUsd)}</strong>
            </div>
          </div>
          <div className="tarjeta-card__fila tarjeta-card__fila--deuda">
            <small>Debes</small>
            <div className="tarjeta-card__valores">
              <strong>₡{formatoColones(tarjeta.totalAdeudadoColones)}</strong>
              <span>|</span>
              <strong>${formatoDolares(tarjeta.totalAdeudadoUsd)}</strong>
            </div>
          </div>
        </div>

        <motion.div
          className="tarjeta-card__wave"
          animate={{ opacity: [0.55, 1, 0.55], y: [0, 4, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </li>
  );
}

export default TarjetaCard;
