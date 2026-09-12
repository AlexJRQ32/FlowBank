import Link from "next/link";
import { formatoColones, formatoDolares } from "@/lib/currency";
import styles from "../tarjetas.module.scss";

export interface TarjetaConBanco {
  id: string;
  nombre: string;
  banco_id: string;
  ultimos_cuatro_digitos: string;
  tipo: string;
  dia_corte: number | null;
  dia_pago: number | null;
  limite_credito: number | null;
  saldo_actual: number | null;
  es_activa: boolean;
  bancos: { nombre: string } | null;
}

function formatoDigitos(digitos: string): string {
  const clean = digitos.replace(/\D/g, "").padStart(4, "•");
  return `•••• •••• •••• ${clean}`;
}

// Static port of legacy TarjetaCard (CSS-only; motion animations dropped per
// the minimal port — gradient/chip/visual language preserved).
export default function TarjetaCard({ tarjeta }: { tarjeta: TarjetaConBanco }) {
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
            <small>Limite de credito</small>
            <div className={styles["tarjeta-card__valores"]}>
              <strong>${formatoDolares(tarjeta.limite_credito)}</strong>
            </div>
          </div>
          <div className={styles["tarjeta-card__fila"]}>
            <small>Saldo actual</small>
            <div className={styles["tarjeta-card__valores"]}>
              <strong>₡{formatoColones(tarjeta.saldo_actual)}</strong>
            </div>
          </div>
        </div>

        <div className={styles["tarjeta-card__wave"]} aria-hidden="true" />
      </Link>
    </li>
  );
}
