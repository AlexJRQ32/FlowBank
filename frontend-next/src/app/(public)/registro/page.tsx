"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/lib/actions/auth";
import { GoogleAuthButton } from "@/components/features/auth/google-auth-button";
import styles from "../auth.module.scss";

const initialState: AuthState = {};

export function RegisterPage() {
  const [state, formAction, submitting] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <main className={styles["auth-page"]}>
      <div className={`${styles["auth-glow"]} ${styles["auth-glow--a"]}`} aria-hidden="true" />
      <div className={`${styles["auth-glow"]} ${styles["auth-glow--b"]}`} aria-hidden="true" />

      <div className={styles["auth-card"]}>
        <img src="/logo.svg" alt="FlowBank" className={styles["auth-card__logo"]} />
        <h1>Crear cuenta</h1>
        <p className={styles["auth-card__subtitle"]}>
          Comienza a controlar tus tarjetas de credito hoy.
        </p>

        <form className={styles["auth-card__form"]} action={formAction} noValidate>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Tu nombre"
            autoComplete="given-name"
            required
          />
          <label htmlFor="apellido">Apellido</label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            placeholder="Tu apellido"
            autoComplete="family-name"
            required
          />
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
            placeholder="Crea una contraseña"
            autoComplete="new-password"
            required
          />
          <button type="submit" className={styles["auth-card__submit"]} disabled={submitting}>
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          {state.error && (
            <p className={`${styles["auth-card__alert"]} ${styles["auth-card__alert--error"]}`} role="alert">
              {state.error}
            </p>
          )}
          {state.notice && (
            <p className={`${styles["auth-card__alert"]} ${styles["auth-card__alert--notice"]}`} role="status">
              {state.notice}
            </p>
          )}
        </form>

        <GoogleAuthButton />

        <p className={styles["auth-card__switch"]}>
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesion</Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
