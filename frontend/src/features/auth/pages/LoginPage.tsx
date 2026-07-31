import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import GoogleLoginButton from "../../../components/ui/GoogleLoginButton/GoogleLoginButton";
import { useToast } from "../../../components/ui/Toast/useToast";
import { useLoading } from "../../../components/ui/Loader/useLoading";
import { api } from "../../../services/api";
import { auth, type AuthUser } from "../../../services/auth";
import "./AuthPages.scss";

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Campos incompletos", "Ingresa tu correo y contraseña.");
      return;
    }

    setSubmitting(true);
    showLoader();
    try {
      const result = await api.post<{ token: string; usuario: AuthUser }>("/auth/login", {
        email: email.trim(),
        password,
      });
      auth.setSession(result.token, result.usuario);
      toast.success("Bienvenido de vuelta", `Sesion iniciada como ${result.usuario.nombre}.`);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error("No se pudo iniciar sesion", err instanceof Error ? err.message : "Intenta de nuevo.");
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow--a" aria-hidden="true" />
      <div className="auth-glow auth-glow--b" aria-hidden="true" />

      <div className="auth-card">
        <img src="/logo.svg" alt="FlowBank" className="auth-card__logo" />
        <h1>Iniciar sesion</h1>
        <p className="auth-card__subtitle">
          Accede a tu cuenta para administrar tus tarjetas.
        </p>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Correo electronico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />
          <button type="submit" className="auth-card__submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Iniciar sesion"}
          </button>
        </form>

        <div className="auth-card__divider">
          <span>o continua con</span>
        </div>

        <div className="auth-card__social">
          <GoogleLoginButton />
        </div>

        <p className="auth-card__switch">
          ¿No tienes cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
