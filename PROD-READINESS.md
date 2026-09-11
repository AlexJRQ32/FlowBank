# PROD-READINESS — FlowBank

> Auditoría de preparación para producción basada en evidencia real de los archivos del repo.
> Fecha de auditoría: 2026-09-10.

## 1. Estado actual

- **Qué es:** App para administrar fechas de corte y pago de tarjetas de crédito (fuente: `README.md`, `frontend/src/...`).
- **Stack real (verificado):**
  - **Backend:** .NET 10 Web API, arquitectura de 3 capas (`FlowBank.Core`, `FlowBank.Data`, `FlowBank.WebAPI`), EF Core 10, SQL Server. Evidencia: `backend/.../*.csproj`, `FlowBankDbContext.cs`, carpeta `Migrations/` (6 migraciones hasta `2026-08-09`), controladores `AuthController`, `BancosController`, `FacturasController`, `TarjetasController`, `TipoCambioController`.
  - **Frontend:** React 19 + Vite 8 (SPA), `react-router` 8, `motion`, Sass. Evidencia: `frontend/package.json`, `vite.config.ts`, `src/services/api.ts`, `src/services/auth.ts`.
- **Autenticación:** JWT real en backend (`TokenService.cs`, `Program.cs` configura `JwtBearer`; secret leíble de `Jwt:Secret` / env `JWT_SECRET`). El frontend guarda el token en `localStorage` (`auth.ts`).
- **LIVE:** existe despliegue en `flowbank-three.vercel.app` (indicado por el usuario). El frontend SPA está desplegado en Vercel (`frontend/vercel.json` confirma despliegue Vercel).

### ⚠️ Bloqueador funcional crítico (no verificado si ya está resuelto)
- `frontend/vercel.json` reescribe **todas** las rutas a `index.html`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- `frontend/src/services/api.ts` define `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api"`.
- En Vercel, una llamada relativa a `/api/...` **no** llega al backend .NET (que no corre en Vercel). Por tanto, el LIVE actual solo funciona si la variable de build `VITE_API_BASE_URL` apunta a un backend hospedado externamente. **No verificado** si ese valor está configurado en Vercel → el LIVE puede estar mostrando la UI pero con todas las llamadas a la API rotas.

## 2. Tabla priorizada de pendientes

| Pri | Ítem | Evidencia / por qué |
|-----|------|---------------------|
| **P0** | Conectar frontend LIVE con el backend | `vercel.json` rewrite + `api.ts` default `/api`. Definir `VITE_API_BASE_URL` en Vercel apuntando al host del backend, o mover el backend a un origen accesible. |
| **P0** | Hospedar el backend (.NET) en producción | `README.md` dice Deployment DB/Backend "(Por definir)". Hoy solo existe plantilla `appsettings.Production.example.json`. |
| **P0** | Eliminar secret JWT de respaldo en código | `Program.cs:46` usa `"FlowBank_Secret_Key_Dev_2026_CambiarEnProduccion_1234567890"` si no se setea `JWT_SECRET`/`Jwt:Secret`. Riesgo crítico. |
| **P1** | CORS en producción | `appsettings.Production.example.json` incluye `http://localhost:5173`. Debe quedar solo el dominio real del frontend. |
| **P1** | `AllowedHosts: "*"` en producción | `appsettings.Production.example.json`. Restringir al dominio real. |
| **P1** | Crear `.env.example` (frontend y backend) | No existe ninguno. Solo hay `appsettings.Production.example.json` como plantilla del backend. |
| **P1** | Estandarizar gestor a pnpm | `README.md` dice `npm install`, pero `frontend/` tiene `pnpm-lock.yaml` (y también `package-lock.json`). Conflicto de lockfiles. Usar pnpm. |
| **P2** | `TrustServerCertificate=True` en connection string | `appsettings.Production.example.json` desactiva validación de certificado TLS (riesgo MITM). Usar cert válido en prod. |
| **P2** | Tests / CI | No se encontraron tests ni config de CI en el repo. |
| **P2** | Validación de entradas en frontend/backend | `api.ts` maneja errores HTTP; validación de negocio en backend no verificada en esta auditoría. |

## 3. Variables de entorno requeridas

### Frontend (`frontend/`, build-time de Vite)
| Variable | Uso | Dónde hoy |
|----------|-----|-----------|
| `VITE_API_BASE_URL` | URL absoluta del backend API (p.ej. `https://api.flowbank.com`) | **No documentada.** Leída en `src/services/api.ts`. Default `/api`. **Debe setearse en Vercel** para que el LIVE funcione. |

### Backend (`.NET`, cargadas desde `backend/.env` vía `DotNetEnv` — ver `Program.cs:11-16`)
| Variable (clave de config) | Uso | Dónde hoy |
|----------------------------|-----|-----------|
| `ConnectionStrings__FlowBankDb` | Connection string SQL Server | Plantilla en `appsettings.Production.example.json` (`Server=...;Database=...;User ID=...;Password=...`). |
| `Jwt__Secret` (o env `JWT_SECRET`) | Clave HS256 para firmar JWT | **Crítico:** si no se setea, `Program.cs:46` usa un secreto de dev hardcodeado. |
| `Jwt__Issuer` / `Jwt__Audience` | Emisor/audiencia del token | `appsettings.Production.example.json` (`FlowBank` / `FlowBankApp`). |
| `GoogleOAuth__ClientId` / `GoogleOAuth__ClientSecret` | Login Google (configurado en backend) | `appsettings.Production.example.json`. Cableado al frontend: **no verificado**. |
| `Cors__Origins` | Orígenes permitidos (array JSON) | `appsettings.Production.example.json` incluye `localhost:5173` + placeholder. |

> No hay `.env.example` ni `.gitignore` expone secretos: `backend/.env` está ignorado (`FlowBank/.gitignore` líneas 23-25, 36). ✅ Bien.

## 4. Plan de deployment paso a paso

### Frontend → Vercel
```bash
cd frontend
pnpm install            # migrar de npm a pnpm (hay pnpm-lock.yaml)
# En Vercel: setear variable de build:
#   VITE_API_BASE_URL=https://<tu-backend>
pnpm build              # tsc -b && vite build
# vercel.json ya reescribe todo a index.html; desplegar.
```
> El proxy `/api -> localhost:5110` de `vite.config.ts` **solo aplica en dev**. En prod usa `VITE_API_BASE_URL`.

### Backend → hosting .NET (Azure App Service / Alwaysdata según comentario en `Program.cs:77`)
```bash
cd backend
dotnet restore
dotnet publish FlowBank.WebAPI -c Release -o publish
# Subir carpeta publish al host.
# Setear variables de entorno (ver tabla 3) en el host, incluyendo JWT_SECRET fuerte.
# Aplicar BD: dotnet ef database update   (o migraciones ya aplicadas)
```
> `README.md` indica `dotnet ef database update` + `dotnet run --project FlowBank.WebAPI` en `http://localhost:5110`.

## 5. Riesgos de seguridad

1. **P0 — Secret JWT por defecto en código fuente** (`Program.cs:46`): si la env no está seteada, cualquiera puede forjar tokens. Mitigar: setear `JWT_SECRET` fuerte en el host y remover el fallback de dev.
2. **P1 — CORS abierto en ejemplo** incluye `localhost` y `*` implícito por `AllowAnyHeader`/`AllowAnyMethod`; restringir a origen real en prod.
3. **P2 — `TrustServerCertificate=True`** desactiva validación de certificado TLS en la conexión a SQL Server (ejemplo). Riesgo de MITM.
4. **P1 — `AllowedHosts: "*"`** en plantilla de producción.
5. **No verificado — alcance de Google OAuth:** el backend tiene `GoogleOAuth` configurado y `AuthController`, pero el frontend (`auth.ts`) solo guarda un token genérico en `localStorage`; no se observó el flujo Google explícito en el frontend. Confirmar si el login Google está realmente cableado end-to-end.
6. Token en `localStorage` (`auth.ts`): susceptible a XSS para robo de sesión. Considerar httpOnly cookie si se reemplaza el flujo.

---
*Evidencia: `README.md`, `frontend/package.json`, `frontend/vercel.json`, `frontend/vite.config.ts`, `frontend/src/services/api.ts`, `frontend/src/services/auth.ts`, `backend/FlowBank.WebAPI/Program.cs`, `backend/FlowBank.WebAPI/appsettings.Production.example.json`, `FlowBank/.gitignore`. Ítems no presentes en los archivos se marcan "no verificado".*
