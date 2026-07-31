# README de documentacion

## Descripcion de la App

Esta es una aplicacion para administrar fechas de corte y de Pago de tarjetas de credito, pensado especialmente para la gente que le cuesta estar entrando a acada aplicacion de banco para revisar cuando es su fecha de corte y cual es su fecha de pago.

## Stack Tecnologico

- Base de Datos: SQL Server (EF Core 10)
- Backend: .NET 10 Web API (3 capas: Core, Data, WebAPI)
- Frontend: React 19 + Vite 8 (modular por features)
- Deployment DB/Backend: (Por definir)
- Deployment Frontend: (Por definir)
- Dominio: (Por definir)

## Arquitectura

- Backend: 3 Capas: Core para datos de entidades, Data para las conexiones con Bases de Datos y WebAPI para crear los controladores y los endpoints que se utilizaran dentro del sistema

- Frontend: Modular basada en Features

## Alcance

- Inicialmente se plantea que sea una App Web Responsive para poderla usar en telefonos y Tablets, pero luego haremos que escale a una App Movil.

## Estructura del Proyecto

```
FlowBank/
├── backend/
│   ├── FlowBank.slnx
│   ├── FlowBank.Core/       # Entidades del dominio
│   ├── FlowBank.Data/       # DbContext, repositorios y EF Core
│   └── FlowBank.WebAPI/     # Controladores y endpoints
└── frontend/                # React + Vite
    └── src/
        ├── components/      # Componentes reutilizables
        ├── features/        # Módulos por feature (dashboard, tarjetas)
        ├── services/        # Cliente de API
        └── lib/             # Utilidades
```

## Como Ejecutar

### Backend

```bash
cd backend
dotnet ef database update
dotnet run --project FlowBank.WebAPI
```

La API corre en `http://localhost:5110` y la migracion usa SQL Server LocalDB (`FlowBankDb`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173` y usa proxy a la API en `/api`.