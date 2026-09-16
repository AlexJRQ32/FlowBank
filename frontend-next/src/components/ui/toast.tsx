"use client";

// Port of legacy src/components/ui/Toast (Toast.tsx + useToast.ts):
// context with success/error push, 5s auto-dismiss, close button,
// aria-live container. Provider mounted in the root layout.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import styles from "./toast.module.scss";

export type ToastType = "success" | "error";

export interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles["toast-container"]} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles["toast"]} ${styles[`toast--${t.type}`]}`}
            role={t.type === "error" ? "alert" : "status"}
          >
            <span className={styles["toast__icon"]} aria-hidden="true">
              {t.type === "success" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </span>
            <div className={styles["toast__content"]}>
              <strong className={styles["toast__title"]}>{t.title}</strong>
              {t.message && <p className={styles["toast__message"]}>{t.message}</p>}
            </div>
            <button
              type="button"
              className={styles["toast__close"]}
              onClick={() => remove(t.id)}
              aria-label="Cerrar notificacion"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
