import { useState } from "react";
import { Link } from "react-router";
import {
  CreditCardIcon,
  BellIcon,
  LockIcon,
  ScanBarcodeIcon,
} from "../../../components/icons";
import { useAuth } from "../../../hooks/useAuth";
import Reveal from "../../../components/ui/Reveal/Reveal";
import heroArches from "../assets/hero-arches.png";
import logoCard from "../assets/logo-card.png";
import "./LandingPage.scss";

const FEATURES = [
  {
    icon: CreditCardIcon,
    title: "Every card, one place",
    text: "Register each credit card with its closing and payment dates. Only the last 4 digits — never the full number.",
  },
  {
    icon: BellIcon,
    title: "Reminders that arrive early",
    text: "Get notified before each cutoff and payment date. No more surprise statements at the end of the month.",
  },
  {
    icon: ScanBarcodeIcon,
    title: "Statements, read for you",
    text: "Snap a photo of your bill and FlowBank extracts the amount, date and merchant. You review and confirm.",
  },
  {
    icon: LockIcon,
    title: "Private by design",
    text: "Sign in with Google and JWT. Everyone sees only their own cards and bills. Your data stays yours.",
  },
];

const STEPS = [
  { num: "01", title: "Create your account", text: "With Google or your email, in under a minute." },
  { num: "02", title: "Add your cards", text: "Set the cutoff and payment dates for each one." },
  { num: "03", title: "See your dates", text: "One calendar with every due date, always up to date." },
];

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page">
      {/* ------------------------------------------------------------- HERO */}
      <section className="hero" style={{ backgroundImage: `url(${heroArches})` }}>
        <div className="hero__scrim" aria-hidden="true" />

        <nav className="hero-nav" aria-label="Main navigation">
          <Link to="/" className="hero-nav__brand">
            <img src={logoCard} alt="FlowBank logo" />
            <span>FlowBank</span>
          </Link>

          <div className="hero-nav__links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="hero-nav__pill" title="Go to dashboard">
                <span className="hero-nav__avatar">{user?.nombre?.[0]?.toUpperCase() ?? "U"}</span>
                <span>{user?.nombre ?? "User"}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hero-nav__login">Log in</Link>
                <Link to="/registro" className="hero-nav__cta">Get started</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="hero-nav__burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu" onClick={closeMenu}>
            <nav aria-label="Mobile menu">
              <a href="#features" onClick={closeMenu}>Features</a>
              <a href="#how" onClick={closeMenu}>How it works</a>
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={closeMenu}>Go to dashboard</Link>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu}>Log in</Link>
                  <Link to="/registro" onClick={closeMenu}>Get started</Link>
                </>
              )}
            </nav>
          </div>
        )}

        <div className="hero__content">
          <Reveal>
            <h1 className="hero__title">
              Every due date,
              <br />
              <em>one quiet place.</em>
            </h1>
            <p className="hero__sub">
              FlowBank tracks the statement closing and payment dates of every
              credit card you own — so you can stop hopping between bank apps.
            </p>
            <div className="hero__actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn--primary">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/registro" className="btn btn--primary">
                    Create free account
                  </Link>
                  <Link to="/login" className="btn btn--ghost">
                    I already have one
                  </Link>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- FEATURES */}
      <section className="features" id="features">
        <Reveal>
          <p className="kicker">Features</p>
          <h2 className="section-title">
            Simple to use,
            <br />
            <em>serious underneath.</em>
          </h2>
        </Reveal>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <article className="feature-card">
                <span className="feature-card__icon">
                  <f.icon size={24} aria-hidden="true" />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- HOW */}
      <section className="how" id="how">
        <Reveal>
          <p className="kicker">How it works</p>
          <h2 className="section-title">
            Three steps,
            <br />
            <em>and you're in.</em>
          </h2>
        </Reveal>
        <ol className="how__strip">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.12}>
              <li className="step">
                <span className="step__num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={0.2}>
          <div className="how__cta">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn--primary">Go to dashboard</Link>
            ) : (
              <Link to="/registro" className="btn btn--primary">Start tracking your dates</Link>
            )}
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------- FOOTER */}
      <footer className="footer">
        <div className="footer__brand">
          <img src={logoCard} alt="FlowBank" />
          <span>FlowBank</span>
        </div>
        <nav className="footer__links" aria-label="Footer navigation">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login">Log in</Link>
          <Link to="/registro">Sign up</Link>
        </nav>
        <p>&copy; 2026 FlowBank. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
