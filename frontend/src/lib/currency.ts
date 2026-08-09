const COLONES_FORMAT = new Intl.NumberFormat("es-CR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DOLARES_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatoColones(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return COLONES_FORMAT.format(valor);
}

export function formatoDolares(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return DOLARES_FORMAT.format(valor);
}

export function simboloMoneda(moneda: "CRC" | "USD"): string {
  return moneda === "USD" ? "$" : "₡";
}
