"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import styles from "../auth.module.scss";

const initialState: AuthState = {};

export function LoginPage() {
  const [state, formAction, submitting] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <main className={styles["auth-page"]}>
      <div className={`${styles["auth-glow"]} ${styles["auth-glow--a"]}`} aria-hidden="true" />
      <div className={`${styles["auth-glow"]} ${styles["auth-glow--b"]}`} aria-hidden="true" />

      <div className={styles["auth-card"]}>
        <img src="/logo.svg" alt="FlowBank" className={styles["auth-card__logo"]} />
        <h1>Iniciar sesion</h1>
        <p className={styles["auth-card__subtitle"]}>
          Accede a tu cuenta para administrar tus tarjetas.
        </p>

        <form className={styles["auth-card__form"]} action={formAction} noValidate>
          <label htmlFor="email">Correo electronico</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
          />
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
          <button type="submit" className={styles["auth-card__submit"]} disabled={submitting}>
            {submitting ? "Ingresando..." : "Iniciar sesion"}
          </button>

          {state.error && (
            <p className={`${styles["auth-card__alert"]} ${styles["auth-card__alert--error"]}`} role="alert">
              {state.error}
            </p>
          )}
        </form>

        <p className={styles["auth-card__switch"]}>
          ¿No tienes cuenta? <Link href="/registro">Registrate</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
