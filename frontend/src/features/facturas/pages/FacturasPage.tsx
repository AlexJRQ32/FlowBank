import { useRef, useState } from "react";
import AppShell from "../../../components/ui/AppShell/AppShell";
import Loader from "../../../components/ui/Loader/Loader";
import { useToast } from "../../../components/ui/Toast/useToast";
import { ScanBarcodeIcon, CreditCardIcon, TrashIcon } from "../../../components/icons";
import { useFacturas } from "../hooks/useFacturas";
import { useTarjetasData } from "../../tarjetas/hooks/useTarjetasData";
import { formatoColones, formatoDolares, simboloMoneda } from "../../../lib/currency";
import type { FacturaExtraccion, Moneda } from "../../../types";
import "./FacturasPage.scss";

export function FacturasPage() {
  const toast = useToast();
  const { facturas, loading, error, extracting, saving, extraer, guardar, eliminar } = useFacturas();
  const { tarjetas, getBanco } = useTarjetasData();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extraccion, setExtraccion] = useState<FacturaExtraccion | null>(null);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("CRC");
  const [fecha, setFecha] = useState("");
  const [comercio, setComercio] = useState("");
  const [tarjetaId, setTarjetaId] = useState<string>("");

  const handleFile = async (file: File) => {
    setExtraccion(null);
    setPreviewUrl(URL.createObjectURL(file));
    setMoneda("CRC");

    try {
      const resultado = await extraer(file);
      setExtraccion(resultado);
      setMonto(resultado.montoTotal > 0 ? String(resultado.montoTotal) : "");
      setFecha(resultado.fechaCompra ? resultado.fechaCompra.slice(0, 10) : "");
      setComercio(resultado.comercio);
    } catch (err: unknown) {
      toast.error(
        "No se pudo leer la factura",
        err instanceof Error ? err.message : "Prueba con una foto mas clara.",
      );
    }
  };

  const handleSubmit = async () => {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error("Datos invalidos", "Ingresa un monto valido.");
      return;
    }

    try {
      await guardar({
        tarjetaId: tarjetaId ? Number(tarjetaId) : null,
        montoTotal: montoNum,
        fechaCompra: fecha || null,
        comercio: comercio || null,
        moneda,
      });
      const simbolo = simboloMoneda(moneda);
      const montoFormateado =
        moneda === "USD" ? formatoDolares(montoNum) : formatoColones(montoNum);
      toast.success(
        "Factura guardada",
        `${simbolo}${montoFormateado} en ${comercio || "comercio"}.`,
      );
      setPreviewUrl(null);
      setExtraccion(null);
      setMonto("");
      setMoneda("CRC");
      setFecha("");
      setComercio("");
      setTarjetaId("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      toast.error(
        "No se pudo guardar la factura",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
    }
  };

  const handleEliminar = async (id: number, comercioNombre: string) => {
    try {
      await eliminar(id);
      toast.success("Factura eliminada", `${comercioNombre || "Comercio"} se elimino correctamente.`);
    } catch (err: unknown) {
      toast.error(
        "No se pudo eliminar",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
    }
  };

  return (
    <AppShell>
      <div className="facturas-page">
        <div className="facturas-page__header">
          <h1>Mis facturas</h1>
          <p>
            Sube una foto de tu factura y FlowBank extrae monto, fecha y comercio
            automaticamente.
          </p>
        </div>

        {error && (
          <p className="facturas-page__error" role="alert">
            Error: {error}
          </p>
        )}

        <div className="facturas-page__uploader">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {previewUrl ? (
            <div className="facturas-page__preview">
              <img src={previewUrl} alt="Vista previa de la factura" />
              <button
                type="button"
                className="facturas-page__cambiar"
                onClick={() => inputRef.current?.click()}
              >
                Cambiar imagen
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="facturas-page__drop"
              onClick={() => inputRef.current?.click()}
            >
              <ScanBarcodeIcon size={36} />
              <strong>Selecciona una foto de factura</strong>
              <span>JPG, PNG, WEBP - maximo 10 MB</span>
            </button>
          )}

          {extracting && <Loader label="Extrayendo datos de la factura..." />}

          {extraccion && (
            <div className="facturas-page__form">
              <h3>Revisa los datos extraidos</h3>
              <div className="facturas-page__fields">
                <div className="facturas-page__field">
                  <label htmlFor="f-monto">Monto total ({moneda === "USD" ? "$" : "₡"})</label>
                  <input
                    id="f-monto"
                    type="number"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="facturas-page__field">
                  <label htmlFor="f-moneda">Moneda</label>
                  <select
                    id="f-moneda"
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as Moneda)}
                  >
                    <option value="CRC">Colones (₡)</option>
                    <option value="USD">Dolares ($)</option>
                  </select>
                </div>
                <div className="facturas-page__field">
                  <label htmlFor="f-fecha">Fecha de compra</label>
                  <input
                    id="f-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
                <div className="facturas-page__field facturas-page__field--full">
                  <label htmlFor="f-comercio">Comercio</label>
                  <input
                    id="f-comercio"
                    type="text"
                    value={comercio}
                    onChange={(e) => setComercio(e.target.value)}
                    placeholder="Nombre del comercio"
                  />
                </div>
                <div className="facturas-page__field facturas-page__field--full">
                  <label htmlFor="f-tarjeta">Asociar a tarjeta</label>
                  <select
                    id="f-tarjeta"
                    value={tarjetaId}
                    onChange={(e) => setTarjetaId(e.target.value)}
                  >
                    <option value="">Sin asociar</option>
                    {tarjetas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} •••• {t.ultimosCuatroDigitos} (
                        {getBanco(t.bancoId)?.nombre ?? "Banco"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="facturas-page__actions">
                <button
                  type="button"
                  className="app-btn app-btn--ghost"
                  onClick={() => {
                    setPreviewUrl(null);
                    setExtraccion(null);
                    setMonto("");
                    setMoneda("CRC");
                    setFecha("");
                    setComercio("");
                    setTarjetaId("");
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar factura"}
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className="facturas-page__section-title">Historial</h2>
        {loading ? (
          <Loader label="Cargando tus facturas..." />
        ) : facturas.length === 0 ? (
          <div className="facturas-page__empty-state">
            <CreditCardIcon size={32} />
            <p>Aun no has registrado facturas.</p>
          </div>
        ) : (
          <ul className="facturas-page__list">
            {facturas.map((f) => (
              <li key={f.id} className="facturas-page__item">
                <div className="facturas-page__item-icon">
                  <ScanBarcodeIcon size={18} />
                </div>
                <div className="facturas-page__item-info">
                  <h3>{f.comercio || "Comercio"}</h3>
                  <p>
                    {new Date(f.fechaCompra).toLocaleDateString("es-CR")}
                    {f.tarjetaId ? " • Asociada a tarjeta" : " • Sin asociar"}
                  </p>
                </div>
                <strong className="facturas-page__item-monto">
                  {simboloMoneda(f.moneda)}
                  {f.moneda === "USD"
                    ? formatoDolares(f.montoTotal)
                    : formatoColones(f.montoTotal)}
                </strong>
                <button
                  type="button"
                  className="facturas-page__delete"
                  aria-label={`Eliminar factura de ${f.comercio || "comercio"}`}
                  onClick={() => handleEliminar(f.id, f.comercio)}
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default FacturasPage;
