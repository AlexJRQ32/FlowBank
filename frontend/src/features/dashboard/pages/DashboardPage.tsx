import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import type { AccionRapida } from "../../../types";
import AppShell from "../../../components/ui/AppShell/AppShell";
import StatCards from "../components/StatCards";
import Loader from "../../../components/ui/Loader/Loader";
import TarjetaFormModal from "../../tarjetas/components/TarjetaFormModal";
import BancoFormModal from "../../bancos/components/BancoFormModal";
import {
  CreditCardIcon,
  BellIcon,
  ScanBarcodeIcon,
  WalletIcon,
} from "../../../components/icons";
import { useTarjetasData } from "../../tarjetas/hooks/useTarjetasData";
import { useFacturas } from "../../facturas/hooks/useFacturas";
import "./DashboardPage.scss";

const STAT_CONFIG = [
  { key: "tarjetas", icon: CreditCardIcon, color: "blue" as const, label: "Tarjetas" },
  { key: "bancos", icon: WalletIcon, color: "purple" as const, label: "Bancos" },
  { key: "facturas", icon: ScanBarcodeIcon, color: "green" as const, label: "Facturas" },
  { key: "alertas", icon: BellIcon, color: "orange" as const, label: "Alertas" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bancos, tarjetas, loading, saveTarjeta, saveBanco } = useTarjetasData();
  const { facturas } = useFacturas();
  const [tarjetaModalOpen, setTarjetaModalOpen] = useState(false);
  const [bancoModalOpen, setBancoModalOpen] = useState(false);

  const statsData = useMemo(
    () => ({
      tarjetas: tarjetas.length,
      bancos: bancos.length,
      facturas: facturas.length,
      alertas: tarjetas.filter((t) => t.diaPago > 0).length,
    }),
    [tarjetas, bancos, facturas],
  );

  const nombreUsuario = user?.nombre ?? "Usuario";

  const acciones = useMemo<AccionRapida[]>(
    () => [
      {
        key: "tarjeta",
        icon: CreditCardIcon,
        color: "blue",
        title: "Registrar tarjeta",
        desc: "Agrega una nueva tarjeta con sus fechas de corte y pago.",
        action: () => setTarjetaModalOpen(true),
      },
      {
        key: "banco",
        icon: WalletIcon,
        color: "orange",
        title: "Registrar banco",
        desc: "Agrega un nuevo banco al catalogo.",
        action: () => setBancoModalOpen(true),
      },
      {
        key: "factura",
        icon: ScanBarcodeIcon,
        color: "green",
        title: "Subir factura",
        desc: "Fotografia una factura y extrae sus datos automaticamente.",
        action: () => navigate("/dashboard/facturas"),
      },
      {
        key: "alertas",
        icon: BellIcon,
        color: "purple",
        title: "Mis alertas",
        desc: "Revisa las proximas fechas de corte y pago.",
        action: () => navigate("/dashboard/alertas"),
      },
    ],
    [navigate],
  );

  return (
    <AppShell>
      <div className="dashboard-page">
        <div className="dashboard-greeting">
          <h1>Bienvenido, {nombreUsuario}</h1>
          <span className="dashboard-role-badge">Usuario</span>
        </div>

        {loading ? (
          <Loader label="Cargando tus datos..." />
        ) : (
          <StatCards config={STAT_CONFIG} data={statsData} />
        )}

        <h2 className="dashboard-section-title">Acciones rapidas</h2>
        <div className="dashboard-actions">
          {acciones.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.key} type="button" className="action-card" onClick={a.action}>
                <div className={`action-icon action-icon--${a.color}`}>
                  <Icon size={22} />
                </div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc">{a.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <TarjetaFormModal
        open={tarjetaModalOpen}
        onClose={() => setTarjetaModalOpen(false)}
        bancos={bancos}
        onSave={saveTarjeta}
      />

      <BancoFormModal
        open={bancoModalOpen}
        onClose={() => setBancoModalOpen(false)}
        onSave={saveBanco}
      />
    </AppShell>
  );
}

