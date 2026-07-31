import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../../services/api";
import { auth, type AuthUser } from "../../../services/auth";
import { useToast } from "../Toast/useToast";
import { useLoading } from "../../../components/ui/Loader/useLoading";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleLoginButton() {
  const navigate = useNavigate();
  const toast = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [submitting, setSubmitting] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  useEffect(() => {
    const existing = document.getElementById("gsi-script");
    const load = () => {
      if (!window.google?.accounts?.oauth2) return;

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "email profile openid",
        callback: handleCredential,
      });
    };

    if (existing) {
      load();
    } else {
      const script = document.createElement("script");
      script.id = "gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = load;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCredential = async (response: { access_token?: string; error?: string }) => {
    if (response.error || !response.access_token) {
      toast.error("No se pudo iniciar sesion con Google", "El acceso fue cancelado o fallo.");
      setSubmitting(false);
      return;
    }

    showLoader();
    try {
      const result = await api.post<{ token: string; usuario: AuthUser }>(
        "/auth/google",
        { accessToken: response.access_token },
      );
      auth.setSession(result.token, result.usuario);
      toast.success("Sesion iniciada", `Bienvenido, ${result.usuario.nombre}.`);
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(
        "No se pudo iniciar con Google",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
      setSubmitting(false);
    } finally {
      hideLoader();
    }
  };

  const handleClick = () => {
    if (!tokenClientRef.current) {
      toast.error("Google no esta listo", "Espera un momento e intenta de nuevo.");
      return;
    }
    setSubmitting(true);
    tokenClientRef.current.requestAccessToken();
  };

  return (
    <button
      type="button"
      className="social-btn social-btn--google"
      onClick={handleClick}
      disabled={submitting}
      aria-label="Iniciar sesion con Google"
    >
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
      </svg>
      {submitting ? "Conectando con Google..." : "Continuar con Google"}
    </button>
  );
}

export default GoogleLoginButton;
