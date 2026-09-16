"use client";

// Shows a toast for server-action redirect flags (?ok=... / ?logout=1) and
// cleans them from the URL. Mounted in the app layout and the login page.
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

export function FlashToasts() {
  const toast = useToast();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const ok = params.get("ok");
    const logout = params.get("logout");
    if (!ok && !logout) return;

    if (logout) {
      toast.success("Sesion cerrada", "Hasta pronto.");
    } else if (ok === "factura") {
      toast.success("Factura guardada", "Se guardo correctamente.");
    } else if (ok === "perfil") {
      toast.success("Perfil actualizado", "Tus datos se guardaron.");
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("ok");
    url.searchParams.delete("logout");
    window.history.replaceState(null, "", url.toString());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once per navigation

  return null;
}

export default FlashToasts;
