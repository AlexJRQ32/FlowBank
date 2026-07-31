import "./Loader.scss";

interface LoaderProps {
  label?: string;
  fullPage?: boolean;
}

export function Loader({ label = "Cargando...", fullPage = false }: LoaderProps) {
  return (
    <div className={`loader${fullPage ? " loader--full" : ""}`} role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      <span className="loader__label">{label}</span>
    </div>
  );
}

export default Loader;
