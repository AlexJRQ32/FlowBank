// Shared "En construcción" placeholder for Phase-4 stub routes.
// Minimal, consistent card following the Authentic'd dashboard empty-state
// visual language (dashed border card on soft surface).

import styles from "./placeholder.module.scss";

const DESCRIPTIONS: Record<string, string> = {
  tarjetas: "Gestión de tarjetas de credito con fechas de corte y pago.",
  bancos: "Catalogo de bancos para asociar a tus tarjetas.",
  facturas: "Facturas con extraccion automatica por OCR.",
  alertas: "Proximas fechas de corte y pago de tus tarjetas.",
  perfil: "Datos de tu cuenta FlowBank.",
};

export function PlaceholderPage({ slug }: { slug: keyof typeof DESCRIPTIONS | string }) {
  return (
    <div className={styles["placeholder-page"]}>
      <section className={styles["placeholder-state"]}>
        <h3>En construcción</h3>
        <p>{DESCRIPTIONS[slug] ?? "Seccion en construcción."}</p>
      </section>
    </div>
  );
}

export default PlaceholderPage;
