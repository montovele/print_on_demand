export interface StorefrontCartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  productId: string;
  variantId: string;
  artworkAssetId?: string;
  localArtworkId?: string;
  artworkFingerprint?: string;
  artworkSides?: Partial<Record<"front" | "back", string>>;
  localArtworkIds?: Partial<Record<"front" | "back", string>>;
  designConfig?: {
    text: string;
    textColor: string;
    sides: Record<"front" | "back", { artwork: boolean; positionX: number; positionY: number; scale: number; rotation?: number }>;
  };
  options?: Record<string, string>;
}

export const MAX_STOREFRONT_CART_QUANTITY = 30;

function optionsSignature(options?: Record<string, string>) {
  return JSON.stringify(Object.entries(options ?? {}).sort(([first], [second]) => first.localeCompare(second)));
}

export async function fingerprintArtwork(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function addOrIncrementCartItem(
  cart: StorefrontCartItem[],
  item: StorefrontCartItem,
) {
  if (cart.some((cartItem) => !Number.isInteger(cartItem.quantity) || cartItem.quantity < 1)) {
    throw new Error("La bolsa contiene una cantidad no válida. Elimina esos artículos y vuelve a agregarlos.");
  }
  const totalQuantity = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || totalQuantity + item.quantity > MAX_STOREFRONT_CART_QUANTITY) {
    throw new Error(`La bolsa permite hasta ${MAX_STOREFRONT_CART_QUANTITY} unidades por pedido.`);
  }

  const existing = cart.find((cartItem) =>
    cartItem.productId === item.productId
    && cartItem.variantId === item.variantId
    && cartItem.artworkFingerprint === item.artworkFingerprint
    && optionsSignature(cartItem.options) === optionsSignature(item.options),
  );
  if (existing) {
    existing.quantity += item.quantity;
    return { cart, merged: true };
  }

  cart.push(item);
  return { cart, merged: false };
}
