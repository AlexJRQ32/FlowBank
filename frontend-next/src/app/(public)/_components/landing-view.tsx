"use client";

// Landing v2: professional centered layout with expanded sections.
// Anti-slop: editorial typography, no card grids, real product copy,
// full-width CTA, timeline steps with connector line.
// Palette: emerald #0e9f6e / blue #1a56db / light #f7f9f8.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import {
  BellIcon,
  CreditCardIcon,
  FileTextIcon,

  ScanBarcodeIcon,
  TrendingDownIcon,
  WalletIcon,
} from "@/components/icons";
import styles from "../landing.module.scss";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-landing-display",
  display: "swap",
});

// ── Features: editorial list, not card grid ─────────────────────────
const FEATURES = [
  {
    icon: CreditCardIcon,
    title: "Todas tus tarjetas, todos tus bancos",
    text: "Registrá cada tarjeta con su banco, día de corte y día de pago. Solo los últimos 4 dígitos ,  nunca el número completo.",
  },
  {
    icon: TrendingDownIcon,
    title: "Deuda en colones y en dólares",
    text: "Cada monto en su moneda original, sin mezclarlas. Sumamos colones con colones y dólares con dólares, y reportamos las dos cuentas claras.",
  },
  {
    icon: WalletIcon,
    title: "Límite disponible en vivo",
    text: "Tu límite menos lo que debes, usando el tipo de cambio del día. Sin calculadoras ni apps de banco.",
  },
  {
    icon: ScanBarcodeIcon,
    title: "Facturas por foto",
    text: "Tomale foto a tu factura y FlowBank la lee solo: saca el monto, la fecha y el comercio. Vos revisás los datos antes de guardar.",
  },
  {
    icon: BellIcon,
    title: "Alertas de corte y pago",
    text: "El panel te avisa cuántos días faltan para cada corte y cada pago. Ninguna factura sorpresa a fin de mes.",
  },
];

// ── How it works: editorial timeline ────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Crea tu cuenta",
    text: "Con Google o tu correo, en menos de un minuto. Sin tarjeta de crédito, sin compromiso.",
  },
  {
    num: "02",
    title: "Registra tus tarjetas",
    text: "El banco, el día de corte y el de pago de cada una. Solo los últimos 4 dígitos.",
  },
  {
    num: "03",
    title: "Dejá de adivinar",
    text: "Tu resumen con la deuda en colones y dólares por separado, el límite disponible y las próximas fechas, siempre al día.",
  },
];

// ── FAQ: real questions with real answers ───────────────────────────
const FAQS = [
  {
    q: "¿Es gratis?",
    a: "Sí. FlowBank es gratuito para uso personal. No hay planes de pago ni funciones bloqueadas.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Guardamos solo los últimos 4 dígitos de cada tarjeta ,  nunca el número completo. Tus datos están protegidos y solo tú puedes verlos: cada persona accede únicamente a lo suyo, y tu sesion no puede ser leída por otras páginas ni programas.",
  },
  {
    q: "¿Necesito ingresar mis contraseñas de banco?",
    a: "No. FlowBank no conecta con tus bancos. Vos registrás manualmente el banco, los últimos 4 dígitos, el día de corte y el de pago. Sin credenciales bancarias, sin riesgo.",
  },
  {
    q: "¿Cómo funciona leer las facturas por foto?",
    a: "Sacás una foto de la factura con tu celular. FlowBank lee la imagen y saca el monto, la fecha y el comercio por vos. Vos revisás y confirmás antes de guardar. No se guarda la foto.",
  },
];

interface LandingViewProps {
  isAuthed: boolean;
  nombre?: string | null;
}

export default function LandingView({ isAuthed, nombre }: LandingViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className={`${playfair.variable} ${styles["landing-page"]}`}>
      {/* ──────────────────────────────────────────────── HERO */}
      <section className={styles.hero}>
        <Image
          src="/hero-fintech.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles["hero__img"]}
        />
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
            <a href="#faq">Preguntas</a>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["hero-nav__pill"]} title="Ver mi resumen">
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
              <a href="#faq" onClick={closeMenu}>Preguntas</a>
              {isAuthed ? (
                <Link href="/dashboard" onClick={closeMenu}>Ver mi resumen</Link>
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
              <Link href="/dashboard" className={`${styles.btn} ${styles["btn--primary"]}`}>
                Ver mi resumen
              </Link>
            ) : (
              <>
                <Link href="/registro" className={`${styles.btn} ${styles["btn--primary"]}`}>
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className={`${styles.btn} ${styles["btn--ghost"]}`}>
                  Ya tengo una
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────── ALL-IN-ONE BAND */}
      <section className={styles["all-in-one"]}>
        <div className={styles["section-container"]}>
          <span className={`${styles["section-badge"]} ${styles["section-badge--emerald"]}`}>
            Todo en un solo lugar
          </span>
          <h2 className={styles["section-title"]}>
            Deuda, límite, facturas y alertas.
            <br />
            <em>Sin saltar entre apps.</em>
          </h2>
          <div className={styles["all-in-one__list"]}>
            <div className={styles["all-in-one__item"]}>
              <CreditCardIcon size={20} />
              <span>Todas tus tarjetas de todos los bancos</span>
            </div>
            <div className={styles["all-in-one__item"]}>
              <TrendingDownIcon size={20} />
              <span>Deuda en colones y dólares por separado</span>
            </div>
            <div className={styles["all-in-one__item"]}>
              <ScanBarcodeIcon size={20} />
              <span>Facturas por foto, leídas por la app</span>
            </div>
            <div className={styles["all-in-one__item"]}>
              <BellIcon size={20} />
              <span>Alertas de corte y pago</span>
            </div>
            <div className={styles["all-in-one__item"]}>
              <WalletIcon size={20} />
              <span>Límite disponible en tiempo real</span>
            </div>
            <div className={styles["all-in-one__item"]}>
              <FileTextIcon size={20} />
              <span>Tipo de cambio del día, siempre al día</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────── FEATURES: editorial rows */}
      <section className={styles.features} id="features">
        <div className={styles["section-container"]}>
          <span className={`${styles["section-badge"]} ${styles["section-badge--emerald"]}`}>
            Funcionalidades
          </span>
          <h2 className={styles["section-title"]}>
            Lo que hace por ti
            <br />
            <em>antes de fin de mes.</em>
          </h2>
          <div className={styles["features__list"]}>
            {FEATURES.map((f) => (
              <article key={f.title} className={styles["feature-item"]}>
                <span className={styles["feature-item__icon"]}>
                  <f.icon size={24} />
                </span>
                <div className={styles["feature-item__body"]}>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── HOW IT WORKS: editorial timeline */}
      <section className={styles.how} id="how">
        <div className={styles["section-container"]}>
          <span className={`${styles["section-badge"]} ${styles["section-badge--blue"]}`}>
            Cómo funciona
          </span>
          <h2 className={styles["section-title"]}>
            Tres pasos
            <br />
            <em>y listo.</em>
          </h2>
          <ol className={styles["how__timeline"]}>
            {STEPS.map((s, i) => (
              <li key={s.num} className={styles["timeline-step"]}>
                <div className={styles["timeline-step__marker"]}>
                  <span className={styles["timeline-step__num"]}>{s.num}</span>
                  {i < STEPS.length - 1 && (
                    <span className={styles["timeline-step__line"]} aria-hidden="true" />
                  )}
                </div>
                <div className={styles["timeline-step__body"]}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles["how__cta"]}>
            {isAuthed ? (
              <Link href="/dashboard" className={`${styles.btn} ${styles["btn--primary"]}`}>
                Ver mi resumen
              </Link>
            ) : (
              <Link href="/registro" className={`${styles.btn} ${styles["btn--primary"]}`}>
                Dejar de adivinar fechas
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── FAQ */}
      <section className={styles.faq} id="faq">
        <div className={styles["section-container"]}>
          <span className={`${styles["section-badge"]} ${styles["section-badge--emerald"]}`}>
            Preguntas frecuentes
          </span>
          <h2 className={styles["section-title"]}>
            Dudas reales,
            <br />
            <em>respuestas claras.</em>
          </h2>
          <div className={styles["faq__list"]}>
            {FAQS.map((item, i) => (
              <details
                key={item.q}
                className={styles["faq-item"]}
                open={openFaq === i}
                onToggle={(e) => {
                  const target = e.currentTarget as HTMLDetailsElement;
                  setOpenFaq(target.open ? i : null);
                }}
              >
                <summary className={styles["faq-item__q"]}>
                  {item.q}
                </summary>
                <p className={styles["faq-item__a"]}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────── CTA BANNER: full-width */}
      <section className={styles["cta-banner"]}>
        <div className={styles["cta-banner__inner"]}>
          <h2>Dejá de adivinar tus fechas de pago</h2>
          <p>
            Uní todas tus tarjetas en un solo panel. Gratis, sin tarjeta de crédito.
          </p>
          <div className={styles["cta-banner__actions"]}>
            {isAuthed ? (
              <Link href="/dashboard" className={`${styles.btn} ${styles["btn--primary"]}`}>
                Ver mi resumen
              </Link>
            ) : (
              <>
                <Link href="/registro" className={`${styles.btn} ${styles["btn--primary"]}`}>
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

      {/* ──────────────────────────────────────────── FOOTER */}
      <footer className={styles.footer}>
        <div className={styles["footer__brand"]}>
          <Image src="/images/landing/logo-card.png" alt="FlowBank" width={26} height={26} />
          <span>FlowBank</span>
        </div>
        <nav className={styles["footer__links"]} aria-label="Footer">
          <a href="#features">Funcionalidades</a>
          <a href="#how">Cómo funciona</a>
          <a href="#faq">Preguntas</a>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/registro">Crear cuenta</Link>
        </nav>
        <p>&copy; 2026 FlowBank.</p>
      </footer>
    </div>
  );
}

