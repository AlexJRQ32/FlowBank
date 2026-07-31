import { useMemo } from "react";
import AppShell from "../../../components/ui/AppShell/AppShell";
import { BellIcon, CreditCardIcon } from "../../../components/icons";
import { useTarjetasData } from "../../tarjetas/hooks/useTarjetasData";
import type { Banco } from "../../../types";
import "./AlertasPage.scss";

interface FechaProxima {
  tarjetaId: number;
  nombre: string;
  banco: string;
  tipo: "corte" | "pago";
  dia: number;
}

function calcularProximas(tarjetas: ReturnType<typeof useTarjetasData>["tarjetas"], getBanco: (id: number) => Banco | undefined): FechaProxima[] {
  const hoy = new Date().getDate();
  const result: FechaProxima[] = [];

  for (const t of tarjetas) {
    const banco = getBanco(t.bancoId);
    const nombreBanco = banco?.nombre ?? "Banco";
    result.push({ tarjetaId: t.id, nombre: t.nombre, banco: nombreBanco, tipo: "corte", dia: t.diaCorte });
    result.push({ tarjetaId: t.id, nombre: t.nombre, banco: nombreBanco, tipo: "pago", dia: t.diaPago });
  }

  return result.sort((a, b) => {
    const aDist = (a.dia >= hoy ? a.dia - hoy : a.dia + 31 - hoy);
    const bDist = (b.dia >= hoy ? b.dia - hoy : b.dia + 31 - hoy);
    return aDist - bDist;
  });
}

export function AlertasPage() {
  const { tarjetas, loading, error, getBanco } = useTarjetasData();
  const proximas = useMemo(() => calcularProximas(tarjetas, getBanco), [tarjetas, getBanco]);

  return (
    <AppShell>
      <div className="alertas-page">
        <div className="alertas-page__header">
          <h1>Mis alertas</h1>
          <p>Las proximas fechas de corte y pago de tus tarjetas.</p>
        </div>

        {error && (
          <p className="alertas-page__error" role="alert">
            Error: {error}
          </p>
        )}

        {loading ? (
          <p className="alertas-page__empty">Cargando alertas...</p>
        ) : proximas.length === 0 ? (
          <div className="alertas-page__empty-state">
            <BellIcon size={40} />
            <h2>Sin alertas</h2>
            <p>Registra tarjetas para ver tus proximas fechas de corte y pago.</p>
          </div>
        ) : (
          <ul className="alertas-page__list">
            {proximas.map((f) => (
              <li key={`${f.tarjetaId}-${f.tipo}`} className="alertas-page__item">
                <div className={`alertas-page__badge alertas-page__badge--${f.tipo}`}>
                  <CreditCardIcon size={18} />
                </div>
                <div className="alertas-page__info">
                  <h3>
                    {f.tipo === "corte" ? "Fecha de corte" : "Fecha de pago"}
                  </h3>
                  <p>
                    {f.nombre} • {f.banco}
                  </p>
                </div>
                <div className="alertas-page__dia">
                  <small>Dia</small>
                  <strong>{f.dia}</strong>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default AlertasPage;
