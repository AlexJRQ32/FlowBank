import "./GlobalLoader.scss";

export function GlobalLoader() {
  return (
    <div className="global-loader" role="status" aria-live="polite">
      <span className="global-loader__spinner" aria-hidden="true" />
      <span className="global-loader__text">
        Cargando
        <span className="global-loader__dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </span>
    </div>
  );
}

export default GlobalLoader;
