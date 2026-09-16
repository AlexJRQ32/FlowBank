import Link from "next/link";
import { BanknoteIcon, FileTextIcon, ScanBarcodeIcon } from "@/components/icons";
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

  const facturas = (facturasRaw ?? null) as FacturaItem[] | null;

  // Métricas reales
  const totalFacturas = facturas?.length ?? 0;
  const totalUsd = (facturas ?? [])
    .filter((f) => f.moneda === "USD")
    .reduce((s, f) => s + (f.monto_total ?? 0), 0);
  const totalColones = (facturas ?? [])
    .filter((f) => f.moneda !== "USD")
    .reduce((s, f) => s + (f.monto_total ?? 0), 0);
  const facturasConImagen = (facturas ?? []).filter((f) => f.imagen_url).length;

  // Private bucket: imagen_url stores the storage path; sign it for the "Ver"
  // link. Legacy rows with an absolute URL are used as-is.
  const verUrls = new Map<string, string>();
  await Promise.all(
    (facturas ?? []).map(async (f) => {
      if (!f.imagen_url) return;
      if (/^https?:\/\//.test(f.imagen_url)) {
        verUrls.set(f.id, f.imagen_url);
        return;
      }
      const { data: signed } = await supabase.storage
        .from("facturas")
        .createSignedUrl(f.imagen_url, 60 * 60);
      if (signed?.signedUrl) verUrls.set(f.id, signed.signedUrl);
    }),
  );

  return (
    <div className={styles["facturas-page"]}>
      <div className={styles["facturas-page__header"]}>
        <div>
          <h1>Mis facturas</h1>
          <p>
            Sube una foto de tu factura y FlowBank extrae monto, fecha y comercio
            automáticamente.
          </p>
        </div>
        <Link href="/facturas/subir" className={styles["facturas-page__subir"]}>
          <ScanBarcodeIcon size={16} />
          Subir factura
        </Link>
      </div>

      {totalFacturas > 0 && (
        <div className={styles["facturas-bento-metrics"]}>
          <div className={styles["facturas-bento-metric--hero"]}>
            <div className={styles["facturas-bento-metric__header"]}>
              <FileTextIcon size={16} />
              <span className={styles["facturas-bento-metric__label"]}>Total facturas</span>
            </div>
            <div className={styles["facturas-bento-metric__big-number"]}>
              {totalFacturas}
            </div>
            <div className={styles["facturas-bento-metric__sub"]}>
              {facturasConImagen} con imagen
            </div>
          </div>

          <div className={styles["facturas-bento-metric--side"]}>
            {totalColones > 0 && (
              <div className={styles["facturas-bento-metric__item"]}>
                <div className={styles["facturas-bento-metric__header"]}>
                  <BanknoteIcon size={14} />
                  <span className={styles["facturas-bento-metric__label"]}>Total colones</span>
                </div>
                <div className={styles["facturas-bento-metric__value"]}>
                  ₡{formatoColones(totalColones)}
                </div>
              </div>
            )}
            {totalUsd > 0 && (
              <div className={styles["facturas-bento-metric__item"]}>
                <div className={styles["facturas-bento-metric__header"]}>
                  <BanknoteIcon size={14} />
                  <span className={styles["facturas-bento-metric__label"]}>Total dólares</span>
                </div>
                <div className={styles["facturas-bento-metric__value"]}>
                  ${formatoDolares(totalUsd)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className={styles["facturas-page__section-title"]}>Historial</h2>
      {!facturas?.length ? (
        <div className={styles["facturas-page__empty-state"]}>
          <div className={styles["facturas-page__empty-grid"]}>
            <div className={styles["facturas-page__empty-main"]}>
              <FileTextIcon size={32} />
              <p>Aún no has registrado facturas.</p>
              <Link href="/facturas/subir" className={styles["facturas-page__subir"]}>
                Subir primera factura
              </Link>
            </div>
            <div className={styles["facturas-page__empty-preview"]}>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <FileTextIcon size={16} />
                <span>Total facturas</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <BanknoteIcon size={16} />
                <span>Total colones</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <BanknoteIcon size={16} />
                <span>Total dólares</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <ScanBarcodeIcon size={16} />
                <span>Con imagen</span>
              </div>
            </div>
          </div>
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
                    {" · "}
                    {tarjeta
                      ? `${tarjeta.nombre || "Tarjeta"} ·••• ${tarjeta.ultimos_cuatro_digitos}`
                      : "Sin asociar"}
                  </p>
                </div>
                <strong className={styles["facturas-page__item-monto"]}>
                  {formatoMoneda(f.moneda, f.monto_total)}
                </strong>
                {f.imagen_url && (
                  <a
                    href={verUrls.get(f.id) ?? f.imagen_url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles["facturas-page__ver"]}
                  >
                    Ver
                  </a>
                )}
                <form action={deleteFacturaAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className={styles["facturas-page__delete"]}
                    aria-label={`Eliminar factura de ${f.comercio ?? "comercio"}`}
                  >
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
