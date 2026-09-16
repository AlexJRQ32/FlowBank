"use client";

// Landing redesign (anti-slop): copy in Spanish that names the real problem,
// alternating feature rows instead of the 4-equal-cards grid, Playfair
// Display headings via next/font, and only token gradients on CTAs.
// Visual truth: commit 8a192b9 palette + _tokens.scss landing section.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import {
  BellIcon,
  CreditCardIcon,
  ScanBarcodeIcon,
  TrendingDownIcon,
  WalletIcon,
} from "@/components/icons";
import styles from "../landing.module.scss";

// Editorial display for headings (anti-slop: not Inter, not system).
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-landing-display",
  display: "swap",
});

const FEATURES = [
  {
    icon: CreditCardIcon,
    title: "Multi-banco, todas tus tarjetas",
    text: "Registrá cada tarjeta con su banco, día de corte y día de pago. Solo los últimos 4 dígitos — nunca el número completo.",
  },
  {
    icon: TrendingDownIcon,
    title: "Deuda en colones y en dólares",
    text: "Cada monto en su moneda original, sin mezclarlas. Sumamos colones con colones y dólares con dólares, y reportamos las dos cuentas claras.",
  },
  {
    icon: WalletIcon,
    title: "Límite disponible en vivo",
    text: "Tu límite menos lo que debes, convertido con el tipo de cambio de referencia del BCCR actualizado. Sin calculadoras ni apps de banco.",
  },
  {
    icon: ScanBarcodeIcon,
    title: "Facturas por foto",
    text: "Tomale foto a tu factura y FlowBank extrae el monto, la fecha y el comercio con OCR. Vos revisás los datos antes de guardar.",
  },
  {
    icon: BellIcon,
    title: "Alertas de corte y pago",
    text: "El panel te avisa cuántos días faltan para cada corte y cada pago. Ninguna factura sorpresa a fin de mes.",
  },
];

const STEPS = [
  { num: "01", title: "Crea tu cuenta", text: "Con Google o tu correo, en menos de un minuto." },
  { num: "02", title: "Registra tus tarjetas", text: "El banco, el día de corte y el de pago de cada una." },
  { num: "03", title: "Deja de adivinar", text: "Dashboard con deuda, límite y próximas fechas, siempre al día." },
];

interface LandingViewProps {
  isAuthed: boolean;
  nombre?: string | null;
}

export default function LandingView({ isAuthed, nombre }: LandingViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // Solid navbar once the hero image starts scrolling under it
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Block page scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className={`${playfair.variable} ${styles["landing-page"]}`}>
      {/* ------------------------------------------------------------- HERO */}
      <section className={styles.hero}>
        <Image
          src="/hero-fintech.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles["hero__img"]}
        />
        {/* Scrim for headline legibility over the photo (AA contrast). */}
        <div className={styles["hero__scrim"]} aria-hidden="true" />

        <nav
          className={`${styles["hero-nav"]}${scrolled ? ` ${styles["hero-nav--solid"]}` : ""}`}
          aria-label="Navegación principal"
        >
          <Link href="/" className={styles["hero-nav__brand"]}>
            <Image src="/images/landing/logo-card.png" alt="FlowBank" width={34} height={34} />
            <span>FlowBank</span>
          </Link>

          <div className={styles["hero-nav__links"]}>
            <a href="#features">Funcionalidades</a>
            <a href="#how">Cómo funciona</a>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["hero-nav__pill"]} title="Ir al dashboard">
                <span className={styles["hero-nav__avatar"]}>{nombre?.[0]?.toUpperCase() ?? "U"}</span>
                <span>{nombre ?? "Usuario"}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles["hero-nav__login"]}>Iniciar sesión</Link>
                <Link href="/registro" className={styles["hero-nav__cta"]}>Crear cuenta</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles["hero-nav__burger"]}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {menuOpen && (
          <div className={styles["mobile-menu"]} onClick={closeMenu}>
            <nav aria-label="Menú móvil">
              <a href="#features" onClick={closeMenu}>Funcionalidades</a>
              <a href="#how" onClick={closeMenu}>Cómo funciona</a>
              {isAuthed ? (
                <Link href="/dashboard" onClick={closeMenu}>Ir al dashboard</Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu}>Iniciar sesión</Link>
                  <Link href="/registro" onClick={closeMenu}>Crear cuenta</Link>
                </>
              )}
            </nav>
          </div>
        )}

        <div className={styles["hero__content"]}>
          <h1 className={styles["hero__title"]}>
            Una deuda en colones,
            <br />
            <em>otra en dólares,</em>
            <br />
            todos los bancos.
          </h1>
          <p className={styles["hero__sub"]}>
            Estás saltando entre apps de banco para no perder una fecha de pago.
            FlowBank junta el corte, el pago, el límite disponible y las facturas
            de todas tus tarjetas en un solo panel.
          </p>
          <div className={styles["hero__actions"]}>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["btn"] + " " + styles["btn--primary"]}>
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link href="/registro" className={styles["btn"] + " " + styles["btn--primary"]}>
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className={styles["btn"] + " " + styles["btn--ghost"]}>
                  Ya tengo una
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- FEATURES: alternating rows */}
      <section className={styles.features} id="features">
        <span className={`${styles["section-badge"]} ${styles["section-badge--emerald"]}`}>Funcionalidades</span>
        <h2 className={styles["section-title"]}>
          Lo que hace por ti
          <br />
          <em>antes de fin de mes.</em>
        </h2>
        <div className={styles["features__rows"]}>
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={
                styles["feature-row"] +
                (i % 2 === 1 ? ` ${styles["feature-row--flip"]}` : "")
              }
            >
              <span className={styles["feature-row__icon"]}>
                <f.icon size={26} />
              </span>
              <div className={styles["feature-row__body"]}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- HOW */}
      <section className={styles.how} id="how">
        <span className={`${styles["section-badge"]} ${styles["section-badge--blue"]}`}>Cómo funciona</span>
        <h2 className={styles["section-title"]}>
          Tres pasos
          <br />
          <em>y listo.</em>
        </h2>
        <ol className={styles["how__strip"]}>
          {STEPS.map((s, i) => (
            <li key={s.num} className={styles.step} style={{ animationDelay: `${i * 120}ms` }}>
              <span className={styles["step__num"]}>{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className={styles["how__cta"]}>
          {isAuthed ? (
            <Link href="/dashboard" className={styles["btn"] + " " + styles["btn--primary"]}>Ir al dashboard</Link>
          ) : (
            <Link href="/registro" className={styles["btn"] + " " + styles["btn--primary"]}>Dejar de adivinar fechas</Link>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- CTA BANNER */}
      <section className={styles["cta-banner"]}>
        <div className={styles["cta-banner__card"]}>
          <h2>Dejá de adivinar tus fechas de pago</h2>
          <p>
            Uní todas tus tarjetas en un solo panel. Gratis, sin tarjeta de crédito.
          </p>
          <div className={styles["cta-banner__actions"]}>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["btn"] + " " + styles["btn--primary"]}>
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link href="/registro" className={styles["btn"] + " " + styles["btn--primary"]}>
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className={styles["btn-ghost-light"]}>
                  Ya tengo una
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- FOOTER minimal */}
      <footer className={styles.footer}>
        <div className={styles["footer__brand"]}>
          <Image src="/images/landing/logo-card.png" alt="FlowBank" width={26} height={26} />
          <span>FlowBank</span>
        </div>
        <nav className={styles["footer__links"]} aria-label="Footer">
          <a href="#features">Funcionalidades</a>
          <a href="#how">Cómo funciona</a>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/registro">Crear cuenta</Link>
        </nav>
        <p>&copy; 2026 FlowBank.</p>
      </footer>
    </div>
  );
}
