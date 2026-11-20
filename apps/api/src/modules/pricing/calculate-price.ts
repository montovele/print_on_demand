export function calculateSuggestedPrice(totalCost: number, desiredMargin: number): number {
  if (!Number.isFinite(totalCost) || totalCost < 0) {
    throw new RangeError("El costo total debe ser un número válido mayor o igual a cero.");
  }
  if (!Number.isFinite(desiredMargin) || desiredMargin < 0 || desiredMargin >= 1) {
    throw new RangeError("El margen debe ser mayor o igual a cero y menor que uno.");
  }
  return Math.round((totalCost / (1 - desiredMargin) + Number.EPSILON) * 100) / 100;
}

export function calculateGrossMargin(salePrice: number, totalCost: number): number {
  if (!Number.isFinite(salePrice) || salePrice < 0 || !Number.isFinite(totalCost) || totalCost < 0) {
    throw new RangeError("Los importes deben ser números válidos mayores o iguales a cero.");
  }
  if (salePrice === 0) return 0;
  return Math.round(((salePrice - totalCost) / salePrice + Number.EPSILON) * 10000) / 10000;
}
