import type { ComponentType } from "react";

export interface Banco {
  id: number;
  nombre: string;
  logoUrl: string | null;
  esActivo: boolean;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

export type Moneda = "CRC" | "USD";

export interface Tarjeta {
  id: number;
  usuarioId: number | null;
  bancoId: number;
  nombre: string;
  ultimosCuatroDigitos: string;
  tipo: string;
  diaCorte: number;
  diaPago: number;
  limiteCredito: number;
  limiteCreditoColones?: number | null;
  limiteDisponibleUsd?: number | null;
  limiteDisponibleColones?: number | null;
  saldoActual: number;
  totalAdeudado?: number;
  totalAdeudadoUsd?: number | null;
  totalAdeudadoColones?: number | null;
  nota: string | null;
  esActiva: boolean;
}

export interface Factura {
  id: number;
  tarjetaId: number | null;
  usuarioId: number | null;
  montoTotal: number;
  moneda: Moneda;
  fechaCompra: string;
  comercio: string;
  imagenUrl: string | null;
  fechaRegistro: string;
}

export interface FacturaExtraccion {
  montoTotal: number;
  fechaCompra: string | null;
  comercio: string;
  textoCompleto: string;
}

export interface TarjetaInput {
  nombre: string;
  bancoId: number;
  ultimosCuatroDigitos: string;
  tipo: string;
  diaCorte: number;
  diaPago: number;
  limiteCredito: number;
}

export interface FacturaInput {
  tarjetaId: number | null;
  montoTotal: number;
  fechaCompra: string | null;
  comercio: string | null;
  moneda: Moneda;
}

export interface TipoCambio {
  compra: number | null;
  venta: number | null;
  fecha: string | null;
}

export type AccionColor = "blue" | "orange" | "green" | "purple" | "gray";

export interface AccionRapida {
  key: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  color: AccionColor;
  title: string;
  desc: string;
  action: () => void;
}
