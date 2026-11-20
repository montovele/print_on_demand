export function formatCurrency(value: number, currency = "MXN"): string {
  if (!Number.isFinite(value)) throw new RangeError("El importe debe ser un número finito.");
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}
