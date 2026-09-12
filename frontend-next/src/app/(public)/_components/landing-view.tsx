"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BellIcon,
  CreditCardIcon,
  LockIcon,
  ScanBarcodeIcon,
} from "@/components/icons";
import styles from "../landing.module.scss";

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
    <div className={styles["landing-page"]}>
      {/* ------------------------------------------------------------- HERO */}
      <section className={styles.hero} style={{ backgroundImage: "url(/images/landing/hero-arches.png)" }}>
        <div className={styles["hero__scrim"]} aria-hidden="true" />

        <nav
          className={`${styles["hero-nav"]}${scrolled ? ` ${styles["hero-nav--solid"]}` : ""}`}
          aria-label="Main navigation"
        >
          <Link href="/" className={styles["hero-nav__brand"]}>
            <Image src="/images/landing/logo-card.png" alt="FlowBank logo" width={34} height={34} />
            <span>FlowBank</span>
          </Link>

          <div className={styles["hero-nav__links"]}>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["hero-nav__pill"]} title="Go to dashboard">
                <span className={styles["hero-nav__avatar"]}>{nombre?.[0]?.toUpperCase() ?? "U"}</span>
                <span>{nombre ?? "User"}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles["hero-nav__login"]}>Log in</Link>
                <Link href="/registro" className={styles["hero-nav__cta"]}>Get started</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles["hero-nav__burger"]}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {menuOpen && (
          <div className={styles["mobile-menu"]} onClick={closeMenu}>
            <nav aria-label="Mobile menu">
              <a href="#features" onClick={closeMenu}>Features</a>
              <a href="#how" onClick={closeMenu}>How it works</a>
              {isAuthed ? (
                <Link href="/dashboard" onClick={closeMenu}>Go to dashboard</Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu}>Log in</Link>
                  <Link href="/registro" onClick={closeMenu}>Get started</Link>
                </>
              )}
            </nav>
          </div>
        )}

        <div className={styles["hero__content"]}>
          <h1 className={styles["hero__title"]}>
            Every due date,
            <br />
            <em>one quiet place.</em>
          </h1>
          <p className={styles["hero__sub"]}>
            FlowBank tracks the statement closing and payment dates of every
            credit card you own — so you can stop hopping between bank apps.
          </p>
          <div className={styles["hero__actions"]}>
            {isAuthed ? (
              <Link href="/dashboard" className={styles["btn"] + " " + styles["btn--primary"]}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/registro" className={styles["btn"] + " " + styles["btn--primary"]}>
                  Create free account
                </Link>
                <Link href="/login" className={styles["btn"] + " " + styles["btn--ghost"]}>
                  I already have one
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- FEATURES */}
      <section className={styles.features} id="features">
        <p className={styles.kicker}>Features</p>
        <h2 className={styles["section-title"]}>
          Simple to use,
          <br />
          <em>serious underneath.</em>
        </h2>
        <div className={styles["features__grid"]}>
          {FEATURES.map((f, i) => (
            <article key={f.title} className={styles["feature-card"]} style={{ animationDelay: `${i * 80}ms` }}>
              <span className={styles["feature-card__icon"]}>
                <f.icon size={24} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- HOW */}
      <section className={styles.how} id="how">
        <p className={styles.kicker}>How it works</p>
        <h2 className={styles["section-title"]}>
          Three steps,
          <br />
          <em>and you&apos;re in.</em>
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
            <Link href="/dashboard" className={styles["btn"] + " " + styles["btn--primary"]}>Go to dashboard</Link>
          ) : (
            <Link href="/registro" className={styles["btn"] + " " + styles["btn--primary"]}>Start tracking your dates</Link>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- FOOTER */}
      <footer className={styles.footer}>
        <div className={styles["footer__brand"]}>
          <Image src="/images/landing/logo-card.png" alt="FlowBank" width={26} height={26} />
          <span>FlowBank</span>
        </div>
        <nav className={styles["footer__links"]} aria-label="Footer navigation">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link href="/login">Log in</Link>
          <Link href="/registro">Sign up</Link>
        </nav>
        <p>&copy; 2026 FlowBank. All rights reserved.</p>
      </footer>
    </div>
  );
}
