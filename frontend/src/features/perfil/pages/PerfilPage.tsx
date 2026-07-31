import AppShell from "../../../components/ui/AppShell/AppShell";
import { useAuth } from "../../../hooks/useAuth";
import "./PerfilPage.scss";

export function PerfilPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="perfil-page">
        <div className="perfil-page__header">
          <h1>Mi perfil</h1>
          <p>Tus datos de cuenta en FlowBank.</p>
        </div>

        <div className="perfil-page__card">
          <div className="perfil-page__avatar">
            {(user?.nombre ?? "U")[0]?.toUpperCase() ?? "U"}
          </div>
          <dl className="perfil-page__fields">
            <div>
              <dt>Nombre</dt>
              <dd>{user?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>Apellido</dt>
              <dd>{user?.apellido || "—"}</dd>
            </div>
            <div>
              <dt>Correo electronico</dt>
              <dd>{user?.email ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}

export default PerfilPage;
