import { useState } from "react";
import { Link } from "react-router";
import {
  CreditCardIcon,
  BellIcon,
  LockIcon,
  UsersGroupIcon,
  ScanBarcodeIcon,
} from "../../../components/icons";
import { useAuth } from "../../../hooks/useAuth";
import Reveal from "../../../components/ui/Reveal/Reveal";
import "./LandingPage.scss";

const BANCOS = ["BCR", "BAC", "BNCR", "Davivienda", "Scotiabank", "Banco Popular"];

const FEATURES = [
  {
    id: "01",
    icon: CreditCardIcon,
    title: "Tu cartera en un vistazo",
    text: "Registra cada tarjeta con su dia de corte y de pago. Solo los ultimos 4 digitos, nunca el numero completo.",
  },
  {
    id: "02",
    icon: ScanBarcodeIcon,
    title: "Facturas que se leen solas",
    text: "Fotografia tus facturas y la app extrae monto, fecha y comercio. Tu mismo revisas y corriges antes de guardar.",
  },
  {
    id: "03",
    icon: BellIcon,
    title: "Alertas antes de la fecha",
    text: "Recibe avisos cuando se acerca el corte o el pago. Nunca mas una tarjeta al dia de la fecha sin saberlo.",
  },
  {
    id: "04",
    icon: LockIcon,
    title: "Seguridad en serio",
    text: "Sesion con Google y JWT. Cada quien ve solo lo suyo. Tu informacion protegida de punta a punta.",
  },
];

const STEPS = [
  {
    numero: "01",
    titulo: "Crea tu cuenta",
    detalle: "Con Google o tu correo, en menos de un minuto.",
  },
  {
    numero: "02",
    titulo: "Agrega tus tarjetas",
    detalle: "Configura fechas, limites y ultimos 4 digitos.",
  },
  {
    numero: "03",
    titulo: "Vive tranquilo",
    detalle: "Sube facturas, revisa gastos y recibe alertas.",
  },
];

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar" aria-label="Navegacion principal">
        <Link to="/" className="navbar-brand">
          <img src="/logo.svg" alt="FlowBank logo" />
          <span>FlowBank</span>
        </Link>
        <div className="navbar-links">
          <a href="#features">Funcionalidades</a>
          <a href="#how">Como funciona</a>
          {isAuthenticated ? (
            <Link to="/dashboard" className="navbar-user-pill" title="Ir al Dashboard">
              <span className="navbar-user-avatar">
                {user?.nombre?.[0]?.toUpperCase() ?? "U"}
              </span>
              <span className="navbar-user-name">{user?.nombre ?? "Usuario"}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="navbar-login">
                Iniciar sesion
              </Link>
              <Link to="/registro" className="btn-nav">
                Comenzar
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar-burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
      <div className={`mobile-menu${menuOpen ? " mobile-menu--open" : ""}`}>
        <nav className="mobile-menu__nav" aria-label="Menu movil">
          <a href="#features" onClick={closeMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Funcionalidades
          </a>
          <a href="#how" onClick={closeMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Como funciona
          </a>
          <div className="mobile-menu__divider" />
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={closeMenu}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M3 9h18M9 21h6" />
              </svg>
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                Iniciar sesion
              </Link>
              <Link to="/registro" className="mobile-menu__cta" onClick={closeMenu}>
                Comenzar
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </nav>
      </div>

      <main className="landing">
        {/* ---------------------------------------------------------- HERO */}
        <section className="hero">
          <div className="hero-glow hero-glow--a" aria-hidden="true" />
          <div className="hero-glow hero-glow--b" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-copy">
            <p className="hero-eyebrow">Control financiero sin esfuerzo</p>
            <h1 className="hero-title">
              Tus fechas de corte,
              <br />
              <em>en un solo vistazo.</em>
            </h1>
            <p className="hero-sub">
              FlowBank junta todas tus tarjetas de credito en un solo lugar:
              fechas de corte, de pago, facturas y alertas. Olvidate de andar
              de app en app.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">
                  Ir al dashboard
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link to="/registro" className="btn-primary">
                    Crear cuenta gratis
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link to="/login" className="btn-ghost">
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>

            <dl className="hero-stats">
              <div className="hero-stat">
                <dt>Un solo</dt>
                <dd>lugar</dd>
              </div>
              <div className="hero-stat">
                <dt>Solo</dt>
                <dd>4 digitos</dd>
              </div>
              <div className="hero-stat">
                <dt>Cero</dt>
                <dd>apps bancarias</dd>
              </div>
            </dl>
          </div>

          {/* Tarjeta flotante construida en CSS */}
          <div className="hero-card-wrap" aria-hidden="true">
            <div className="cc">
              <div className="cc-chip" />
              <div className="cc-brand">
                <img src="/logo.svg" alt="" />
                <span>FlowBank</span>
              </div>
              <div className="cc-number">••••  ••••  ••••  2841</div>
              <div className="cc-meta">
                <div className="cc-field">
                  <span>Titular</span>
                  <strong>A. Roblero</strong>
                </div>
                <div className="cc-field">
                  <span>Vence</span>
                  <strong>09/29</strong>
                </div>
              </div>
              <div className="cc-wave" />
            </div>
            <div className="hero-card-float hero-card-float--small">
              <span className="hf-dot" />
              <div>
                <small>Corte</small>
                <strong>12 ago</strong>
              </div>
            </div>
            <div className="hero-card-float hero-card-float--large">
              <div>
                <small>Pago</small>
                <strong>02 ago</strong>
              </div>
              <span className="hf-check">✓</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ TICKER */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...BANCOS, ...BANCOS].map((b, i) => (
              <span key={i} className="ticker-item">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------- ABOUT */}
        <section className="about" id="about">
          <Reveal>
            <div className="about-head">
              <p className="section-kicker">La idea</p>
              <h2 className="section-title">
                Dejar de perseguir fechas
                <br />
                <em>entre apps de banco.</em>
              </h2>
            </div>
          </Reveal>

          <div className="about-body">
            <Reveal delay={0.1}>
              <p className="about-lead">
                Cada tarjeta tiene su corte y su pago. Entre el BCR, el BAC y el
                BN, es facil perderse. FlowBank centraliza todo para que solo te
                preocupes por una pantalla.
              </p>
            </Reveal>
            <div className="about-highlights">
              <Reveal delay={0.15}>
                <div className="highlight-item">
                  <UsersGroupIcon size={20} aria-hidden="true" />
                  <div>
                    <strong>Multi-usuario</strong>
                    <small>Cada persona ve solo sus tarjetas y facturas</small>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="highlight-item">
                  <BellIcon size={20} aria-hidden="true" />
                  <div>
                    <strong>Alertas a tiempo</strong>
                    <small>Avisos antes del corte y del pago, sin sorpresas</small>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.35}>
                <div className="highlight-item">
                  <LockIcon size={20} aria-hidden="true" />
                  <div>
                    <strong>Privacidad real</strong>
                    <small>Guardamos solo los ultimos 4 digitos de tu tarjeta</small>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- FEATURES */}
        <section className="features" id="features">
          <Reveal>
            <div className="features-head">
              <p className="section-kicker">Funcionalidades</p>
              <h2 className="section-title">
                Simple de usar,
                <br />
                <em>serio por dentro.</em>
              </h2>
            </div>
          </Reveal>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.1}>
                <article className="feature-card">
                  <span className="feature-card__num">{f.id}</span>
                  <f.icon size={26} aria-hidden="true" />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- COMO */}
        <section className="how" id="how">
          <Reveal>
            <div className="how-head">
              <p className="section-kicker">Como funciona</p>
              <h2 className="section-title">
                En tres pasos,
                <br />
                <em>estas dentro.</em>
              </h2>
            </div>
          </Reveal>

          <ol className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.numero} delay={i * 0.15}>
                <li className="step">
                  <span className="step__num">{s.numero}</span>
                  <h3>{s.titulo}</h3>
                  <p>{s.detalle}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* -------------------------------------------------------- CTA */}
        <section className="cta">
          <div className="cta-glow" aria-hidden="true" />
          <Reveal>
            <h2 className="cta-title">
              Tu proximo pago no deberia ser una sorpresa.
            </h2>
            <p className="cta-sub">
              Crea tu cuenta gratis y pon tus fechas donde las puedes ver.
            </p>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary btn-primary--light">
                Ir al dashboard
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link to="/registro" className="btn-primary btn-primary--light">
                Comenzar gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <img src="/logo.svg" alt="FlowBank" />
          <span>FlowBank</span>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#about">La idea</a>
          <a href="#features">Funcionalidades</a>
          <a href="#how">Como funciona</a>
          <Link to="/login">Login</Link>
          <Link to="/registro">Registro</Link>
        </nav>
        <p>&copy; 2026 FlowBank. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}

export default LandingPage;
