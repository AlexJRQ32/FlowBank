import Link from "next/link";
import { formatoColones, formatoDolares } from "@/lib/currency";
import type { TarjetaConDeuda } from "@/lib/queries/tarjetas";
import styles from "../tarjetas.module.scss";

function formatoDigitos(digitos: string): string {
  const clean = digitos.replace(/\D/g, "").padStart(4, "•");
  return `•••• •••• •••• ${clean}`;
}

// Static port of legacy TarjetaCard (CSS-only; motion animations dropped per
// the minimal port — gradient/chip/visual language preserved). Info rows match
// legacy: "Limite disponible" (₡ | $) and "Debes" (₡ | $), computed server-side
// with the day's tipo de cambio.
export default function TarjetaCard({ tarjeta }: { tarjeta: TarjetaConDeuda }) {
  return (
    <li className={styles["tarjeta-slot"]}>
      <Link
        href={`/tarjetas/${tarjeta.id}/editar`}
        className={styles["tarjeta-card__plastico"]}
        aria-label={`Editar ${tarjeta.nombre}`}
      >
        <div className={styles["tarjeta-card__shine"]} aria-hidden="true" />
        <div className={styles["tarjeta-card__top"]}>
          <div className={styles["tarjeta-card__chip"]} aria-hidden="true" />
          <div className={styles["tarjeta-card__brand"]}>
            <img src="/logo.svg" alt="" />
            <span>{tarjeta.bancos?.nombre ?? "Banco"}</span>
          </div>
          {!tarjeta.es_activa && (
            <span className={styles["tarjeta-card__inactiva"]}>Inactiva</span>
          )}
        </div>

        <div className={styles["tarjeta-card__number"]}>
          {formatoDigitos(tarjeta.ultimos_cuatro_digitos)}
        </div>
        <div className={styles["tarjeta-card__alias"]}>{tarjeta.nombre}</div>

        <div className={styles["tarjeta-card__mid"]}>
          <div className={styles["tarjeta-card__dates"]}>
            <div className={styles["tarjeta-card__field"]}>
              <span>Corte</span>
              <strong>Dia {tarjeta.dia_corte ?? "—"}</strong>
            </div>
            <div className={styles["tarjeta-card__field"]}>
              <span>Pago</span>
              <strong>Dia {tarjeta.dia_pago ?? "—"}</strong>
            </div>
          </div>
          <span className={styles["tarjeta-card__tipo"]}>{tarjeta.tipo}</span>
        </div>

        <div className={styles["tarjeta-card__info"]}>
          <div className={styles["tarjeta-card__fila"]}>
            <small>Limite disponible</small>
            <div className={styles["tarjeta-card__valores"]}>
              <strong>₡{formatoColones(tarjeta.limite_disponible_colones)}</strong>
              <span>|</span>
              <strong>${formatoDolares(tarjeta.limite_disponible_usd)}</strong>
            </div>
          </div>
          <div className={styles["tarjeta-card__fila"]}>
            <small>Debes</small>
            <div className={styles["tarjeta-card__valores"]}>
              <strong>₡{formatoColones(tarjeta.total_adeudado_colones)}</strong>
              <span>|</span>
              <strong>${formatoDolares(tarjeta.total_adeudado_usd)}</strong>
            </div>
          </div>
        </div>

        <div className={styles["tarjeta-card__wave"]} aria-hidden="true" />
      </Link>
    </li>
  );
}
