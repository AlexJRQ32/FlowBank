// Port of legacy src/components/ui/CreditCardPreview/CreditCardPreview.tsx -
// same visual and live-reflection of form state; framer-motion animations are
// replicated with CSS keyframes in the module (shine sweep, glow pulse, chip
// glow, hover lift) so no animation dependency is introduced.
import { formatoColones, formatoDolares } from "@/lib/currency";
import styles from "./credit-card-preview.module.scss";

interface CreditCardPreviewProps {
  nombre: string;
  banco: string;
  ultimosDigitos: string;
  titular: string;
  diaCorte?: number;
  diaPago?: number;
  limiteUsd?: number;
  limiteColones?: number | null;
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
  limiteUsd,
  limiteColones,
}: CreditCardPreviewProps) {
  return (
    <div className={styles["cc-preview"]} aria-hidden="true">
      <div className={styles["cc-preview__glow"]} />

      <div className={styles["cc-preview__card"]}>
        {/* Barrido de brillo */}
        <div className={styles["cc-preview__shine"]} />

        <div className={styles["cc-preview__top"]}>
          <div className={styles["cc-preview__chip"]} />
          <div className={styles["cc-preview__brand"]}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" />
            <span>{banco || "Banco"}</span>
          </div>
        </div>

        <div className={styles["cc-preview__number"]}>
          {formatNumber(ultimosDigitos)}
        </div>
        <div className={styles["cc-preview__alias"]}>{nombre || "Nueva tarjeta"}</div>

        <div className={styles["cc-preview__bottom"]}>
          <div className={styles["cc-preview__field"]}>
            <span>Titular</span>
            <strong>{titular || "Tu Nombre"}</strong>
          </div>
          <div className={styles["cc-preview__dates"]}>
            <div className={styles["cc-preview__field"]}>
              <span>Corte</span>
              <strong>{diaCorte ? `Dia ${diaCorte}` : "Dia --"}</strong>
            </div>
            <div className={styles["cc-preview__field"]}>
              <span>Pago</span>
              <strong>{diaPago ? `Dia ${diaPago}` : "Dia --"}</strong>
            </div>
          </div>
        </div>

        {limiteUsd !== undefined && limiteUsd > 0 ? (
          <div className={styles["cc-preview__limite"]}>
            <span>Limite</span>
            <strong>
              ${formatoDolares(limiteUsd)}
              {limiteColones ? (
                <em>≈ ₡{formatoColones(limiteColones)}</em>
              ) : null}
            </strong>
          </div>
        ) : null}

        <div className={styles["cc-preview__wave"]} />
      </div>
    </div>
  );
}

export default CreditCardPreview;
