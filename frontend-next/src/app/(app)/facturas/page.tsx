import Link from "next/link";
import { CreditCardIcon, ScanBarcodeIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { formatoColones, formatoDolares, simboloMoneda } from "@/lib/currency";
import { deleteFacturaAction } from "./actions";
import styles from "./facturas.module.scss";

// Auth-scoped Supabase reads (RLS); must never be cached (Gothic #11).
export const dynamic = "force-dynamic";

interface FacturaItem {
  id: string;
  monto_total: number | null;
  moneda: string;
  fecha_compra: string | null;
  comercio: string | null;
  imagen_url: string | null;
  tarjetas: {
    nombre: string | null;
    ultimos_cuatro_digitos: string | null;
    bancos: { nombre: string } | null;
  } | null;
}

function formatoMoneda(moneda: string, valor: number | null): string {
  const base = moneda === "USD" ? formatoDolares(valor) : formatoColones(valor);
  return `${simboloMoneda(moneda)}${base}`;
}

export default async function FacturasPage() {
  const supabase = await createClient();

  // RLS-scoped join: facturas → tarjetas → bancos.
  const { data: facturasRaw } = await supabase
    .from("facturas")
    .select("id, monto_total, moneda, fecha_compra, comercio, imagen_url, tarjeta_id, tarjetas(nombre, ultimos_cuatro_digitos, bancos(nombre))")
    .order("fecha_compra", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Cast: the plain client's select-string inference types the FK relation as
  // an array; at runtime PostgREST returns an object for the FK embed.
  const facturas = (facturasRaw ?? null) as FacturaItem[] | null;

  return (
    <div className={styles["facturas-page"]}>
      <div className={styles["facturas-page__header"]}>
        <div>
          <h1>Mis facturas</h1>
          <p>
            Sube una foto de tu factura y FlowBank extrae monto, fecha y comercio
            automaticamente.
          </p>
        </div>
        <Link href="/facturas/subir" className={styles["facturas-page__subir"]}>
          <ScanBarcodeIcon size={16} />
          Subir factura
        </Link>
      </div>

      <h2 className={styles["facturas-page__section-title"]}>Historial</h2>
      {!facturas?.length ? (
        <div className={styles["facturas-page__empty-state"]}>
          <CreditCardIcon size={32} />
          <p>Aun no has registrado facturas.</p>
        </div>
      ) : (
        <ul className={styles["facturas-page__list"]}>
          {facturas.map((f) => {
            const tarjeta = f.tarjetas;
            return (
              <li key={f.id} className={styles["facturas-page__item"]}>
                <div className={styles["facturas-page__item-icon"]}>
                  <ScanBarcodeIcon size={18} />
                </div>
                <div className={styles["facturas-page__item-info"]}>
                  <h3>{f.comercio || "Comercio"}</h3>
                  <p>
                    {f.fecha_compra
                      ? new Date(`${f.fecha_compra}T00:00:00`).toLocaleDateString("es-CR")
                      : "Fecha sin registrar"}
                    {" • "}
                    {tarjeta
                      ? `Asociada a ${tarjeta.nombre || "tarjeta"} •••• ${tarjeta.ultimos_cuatro_digitos}`
                      : "Sin asociar"}
                  </p>
                </div>
                <strong className={styles["facturas-page__item-monto"]}>
                  {formatoMoneda(f.moneda, f.monto_total)}
                </strong>
                {f.imagen_url && (
                  <a
                    href={f.imagen_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles["facturas-page__ver"]}
                  >
                    Ver
                  </a>
                )}
                <form action={deleteFacturaAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className={styles["facturas-page__delete"]} aria-label={`Eliminar factura de ${f.comercio ?? "comercio"}`}>
                    Eliminar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
