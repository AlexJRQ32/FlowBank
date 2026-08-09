import { useState } from "react";
import AppShell from "../../../components/ui/AppShell/AppShell";
import Loader from "../../../components/ui/Loader/Loader";
import { useToast } from "../../../components/ui/Toast/useToast";
import TarjetaFormModal from "../components/TarjetaFormModal";
import TarjetaCard from "../components/TarjetaCard";
import BancoFormModal from "../../bancos/components/BancoFormModal";
import { CreditCardIcon, WalletIcon } from "../../../components/icons";
import { useTarjetasData } from "../hooks/useTarjetasData";
import "./TarjetasPage.scss";

export function TarjetasPage() {
  const toast = useToast();
  const { bancos, tarjetas, error, loading, saveTarjeta, saveBanco, deleteTarjeta, getBanco } =
    useTarjetasData();
  const [tarjetaModalOpen, setTarjetaModalOpen] = useState(false);
  const [bancoModalOpen, setBancoModalOpen] = useState(false);

  const handleDelete = async (id: number, nombre: string) => {
    try {
      await deleteTarjeta(id);
      toast.success("Tarjeta eliminada", `${nombre} se elimino correctamente.`);
    } catch (err: unknown) {
      toast.error(
        "No se pudo eliminar",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
    }
  };

  return (
    <AppShell>
      <div className="tarjetas-page">
        <div className="tarjetas-page__header">
          <div>
            <h1>Mis tarjetas</h1>
            <p>Administra todas tus tarjetas de credito y sus fechas.</p>
          </div>
          <div className="tarjetas-page__actions">
            <button
              type="button"
              className="app-btn app-btn--ghost"
              onClick={() => setBancoModalOpen(true)}
            >
              <WalletIcon size={16} />
              Nuevo banco
            </button>
            <button
              type="button"
              className="app-btn app-btn--primary"
              onClick={() => setTarjetaModalOpen(true)}
            >
              <CreditCardIcon size={16} />
              Nueva tarjeta
            </button>
          </div>
        </div>

        {error && (
          <p className="tarjetas-page__error" role="alert">
            Error: {error}
          </p>
        )}

        {loading ? (
          <Loader label="Cargando tus tarjetas..." />
        ) : tarjetas.length === 0 ? (
          <div className="tarjetas-page__empty-state">
            <CreditCardIcon size={40} />
            <h2>Sin tarjetas todavia</h2>
            <p>Registra tu primera tarjeta para empezar a controlar tus fechas.</p>
            <button
              type="button"
              className="app-btn app-btn--primary"
              onClick={() => setTarjetaModalOpen(true)}
            >
              Registrar tarjeta
            </button>
          </div>
        ) : (
          <ul className="tarjetas-page__grid">
            {tarjetas.map((tarjeta) => (
              <TarjetaCard
                key={tarjeta.id}
                tarjeta={tarjeta}
                bancoNombre={getBanco(tarjeta.bancoId)?.nombre}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
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

export default TarjetasPage;

