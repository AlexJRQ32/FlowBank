import { useState } from "react";
import AppShell from "../../../components/ui/AppShell/AppShell";
import Loader from "../../../components/ui/Loader/Loader";
import { useToast } from "../../../components/ui/Toast/useToast";
import TarjetaFormModal from "../components/TarjetaFormModal";
import BancoFormModal from "../../bancos/components/BancoFormModal";
import { CreditCardIcon, WalletIcon, TrashIcon } from "../../../components/icons";
import { useTarjetasData } from "../hooks/useTarjetasData";
import { formatoColones, formatoDolares } from "../../../lib/currency";
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
          <ul className="tarjetas-page__list">
            {tarjetas.map((tarjeta) => {
              const banco = getBanco(tarjeta.bancoId);
              return (
                <li key={tarjeta.id} className="tarjetas-page__card">
                  <div className="tarjetas-page__icon">
                    <CreditCardIcon size={22} />
                  </div>
                  <div className="tarjetas-page__info">
                    <h3>{tarjeta.nombre}</h3>
                    <p>
                      {banco?.nombre ?? "Banco"} •••• {tarjeta.ultimosCuatroDigitos}
                    </p>
                  </div>
                  <div className="tarjetas-page__dates">
                    <div>
                      <small>Corte</small>
                      <strong>Dia {tarjeta.diaCorte}</strong>
                    </div>
                    <div>
                      <small>Pago</small>
                      <strong>Dia {tarjeta.diaPago}</strong>
                    </div>
                  </div>
                  <div className="tarjetas-page__montos">
                    {tarjeta.limiteCredito > 0 ? (
                      <div className="tarjetas-page__monto">
                        <small>Limite disponible</small>
                        <div className="tarjetas-page__monto-valores">
                          <strong>₡{formatoColones(tarjeta.limiteDisponibleColones)}</strong>
                          <span>|</span>
                          <strong>${formatoDolares(tarjeta.limiteDisponibleUsd)}</strong>
                        </div>
                      </div>
                    ) : null}
                    <div className="tarjetas-page__monto tarjetas-page__monto--deuda">
                      <small>Debes</small>
                      <div className="tarjetas-page__monto-valores">
                        <strong>₡{formatoColones(tarjeta.totalAdeudadoColones)}</strong>
                        <span>|</span>
                        <strong>${formatoDolares(tarjeta.totalAdeudadoUsd)}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="tarjetas-page__tipo">{tarjeta.tipo}</span>
                  <button
                    type="button"
                    className="tarjetas-page__delete"
                    aria-label={`Eliminar ${tarjeta.nombre}`}
                    onClick={() => handleDelete(tarjeta.id, tarjeta.nombre)}
                  >
                    <TrashIcon size={16} />
                  </button>
                </li>
              );
            })}
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

