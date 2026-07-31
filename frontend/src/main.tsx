import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.scss";
import App from "./App";
import ToastProvider from "./components/ui/Toast/Toast";
import { LoadingProvider } from "./components/ui/Loader/LoadingContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoadingProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LoadingProvider>
  </StrictMode>,
);
