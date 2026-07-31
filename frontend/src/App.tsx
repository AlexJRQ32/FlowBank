import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import type { ReactNode } from "react";
import LandingPage from "./features/landing/pages/LandingPage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import TarjetasPage from "./features/tarjetas/pages/TarjetasPage";
import FacturasPage from "./features/facturas/pages/FacturasPage";
import AlertasPage from "./features/alertas/pages/AlertasPage";
import PerfilPage from "./features/perfil/pages/PerfilPage";
import { auth } from "./services/auth";

function RequireAuth({ children }: { children: ReactNode }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/tarjetas"
          element={
            <RequireAuth>
              <TarjetasPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/facturas"
          element={
            <RequireAuth>
              <FacturasPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/alertas"
          element={
            <RequireAuth>
              <AlertasPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/perfil"
          element={
            <RequireAuth>
              <PerfilPage />
            </RequireAuth>
          }
        />
        <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
