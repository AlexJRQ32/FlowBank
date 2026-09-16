import Link from "next/link";
import { BanknoteIcon, FileTextIcon, ScanBarcodeIcon, TrendingDownIcon } from "@/components/icons";
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

function inicioMes(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  // === Métricas únicas de facturas (NO repetir dashboard) ===
  const totalFacturas = facturas?.length ?? 0;
  const facturasConImagen = (facturas ?? []).filter((f) => f.imagen_url).length;

  // Gasto este mes vs mes anterior
  const hoy = new Date();
  const inicioMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const facturasMesActual = (facturas ?? []).filter(
    (f) => f.fecha_compra && f.fecha_compra >= inicioMesActual,
  );
  const facturasMesAnterior = (facturas ?? []).filter(
    (f) => f.fecha_compra && f.fecha_compra >= fmtDate(inicioMesAnterior) && f.fecha_compra <= fmtDate(finMesAnterior),
  );

  const gastoMesActual = facturasMesActual.reduce((s, f) => s + (f.monto_total ?? 0), 0);
  const gastoMesAnterior = facturasMesAnterior.reduce((s, f) => s + (f.monto_total ?? 0), 0);
  const promedioFactura = totalFacturas > 0
    ? (facturas ?? []).reduce((s, f) => s + (f.monto_total ?? 0), 0) / totalFacturas
    : 0;

  // Top comercio (más frecuente)
  const comercioCount = new Map<string, number>();
  for (const f of facturas ?? []) {
    if (f.comercio) {
      comercioCount.set(f.comercio, (comercioCount.get(f.comercio) ?? 0) + 1);
    }
  }
  const topComercio = [...comercioCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

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
          {/* Hero: Gasto este mes */}
          <div className={styles["facturas-bento-metric--hero"]}>
            <div className={styles["facturas-bento-metric__header"]}>
              <BanknoteIcon size={16} />
              <span className={styles["facturas-bento-metric__label"]}>Gasto este mes</span>
            </div>
            <div className={styles["facturas-bento-metric__big-number"]}>
              ₡{formatoColones(gastoMesActual)}
            </div>
            <div className={styles["facturas-bento-metric__sub"]}>
              {facturasMesActual.length} factura{facturasMesActual.length !== 1 && "s"}
              {gastoMesAnterior > 0 && (
                <span className={styles["facturas-bento-metric__trend"]}>
                  {" "}· mes anterior: ₡{formatoColones(gastoMesAnterior)}
                </span>
              )}
            </div>
          </div>

          <div className={styles["facturas-bento-metric--side"]}>
            {/* Promedio por factura */}
            <div className={styles["facturas-bento-metric__item"]}>
              <div className={styles["facturas-bento-metric__header"]}>
                <TrendingDownIcon size={14} />
                <span className={styles["facturas-bento-metric__label"]}>Promedio</span>
              </div>
              <div className={styles["facturas-bento-metric__value"]}>
                ₡{formatoColones(promedioFactura)}
              </div>
              <div className={styles["facturas-bento-metric__sub"]}>
                Por factura
              </div>
            </div>

            {/* Top comercio */}
            <div className={styles["facturas-bento-metric__item"]}>
              <div className={styles["facturas-bento-metric__header"]}>
                <ScanBarcodeIcon size={14} />
                <span className={styles["facturas-bento-metric__label"]}>Más frecuente</span>
              </div>
              <div className={styles["facturas-bento-metric__value"]}>
                {topComercio ? topComercio[0] : "—"}
              </div>
              <div className={styles["facturas-bento-metric__sub"]}>
                {topComercio ? `${topComercio[1]} compra${topComercio[1] !== 1 ? "s" : ""}` : "Sin datos"}
              </div>
            </div>
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
                <BanknoteIcon size={16} />
                <span>Gasto este mes</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <TrendingDownIcon size={16} />
                <span>Promedio</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <ScanBarcodeIcon size={16} />
                <span>Más frecuente</span>
              </div>
              <div className={styles["facturas-page__empty-preview-item"]}>
                <FileTextIcon size={16} />
                <span>Historial</span>
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
