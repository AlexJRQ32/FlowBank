import { motion } from "motion/react";
import "./CreditCardPreview.scss";

interface CreditCardPreviewProps {
  nombre: string;
  banco: string;
  ultimosDigitos: string;
  titular: string;
  diaCorte?: number;
  diaPago?: number;
}

function formatNumber(digitos: string): string {
  const clean = digitos.replace(/\D/g, "").padStart(4, "•");
  return `•••• •••• •••• ${clean}`;
}

export function CreditCardPreview({
  nombre,
  banco,
  ultimosDigitos,
  titular,
  diaCorte,
  diaPago,
}: CreditCardPreviewProps) {
  return (
    <div className="cc-preview" aria-hidden="true">
      <motion.div
        className="cc-preview__glow"
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="cc-preview__card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.8 }}
        whileHover={{ y: -6, scale: 1.02 }}
      >
        {/* Barrido de brillo */}
        <motion.div
          className="cc-preview__shine"
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }}
        />

        <div className="cc-preview__top">
          <motion.div
            className="cc-preview__chip"
            animate={{ boxShadow: [
              "0 0 0 0 rgba(212, 175, 55, 0)",
              "0 0 18px 2px rgba(212, 175, 55, 0.45)",
              "0 0 0 0 rgba(212, 175, 55, 0)",
            ] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="cc-preview__brand">
            <img src="/logo.svg" alt="" />
            <span>{banco || "Banco"}</span>
          </div>
        </div>

        <motion.div
          className="cc-preview__number"
          animate={{ opacity: [0.75, 1, 0.75], letterSpacing: ["2px", "3px", "2px"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {formatNumber(ultimosDigitos)}
        </motion.div>
        <div className="cc-preview__alias">{nombre || "Nueva tarjeta"}</div>

        <div className="cc-preview__bottom">
          <div className="cc-preview__field">
            <span>Titular</span>
            <strong>{titular || "Tu Nombre"}</strong>
          </div>
          <div className="cc-preview__dates">
            <div className="cc-preview__field">
              <span>Corte</span>
              <strong>{diaCorte ? `Dia ${diaCorte}` : "Dia --"}</strong>
            </div>
            <div className="cc-preview__field">
              <span>Pago</span>
              <strong>{diaPago ? `Dia ${diaPago}` : "Dia --"}</strong>
            </div>
          </div>
        </div>

        <motion.div
          className="cc-preview__wave"
          animate={{ opacity: [0.55, 1, 0.55], y: [0, 4, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

export default CreditCardPreview;
