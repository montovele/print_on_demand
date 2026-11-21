export type CustomerProductKind = "tee" | "hoodie" | "socks" | "mug" | "bottle" | "tote" | "poster" | "pillow" | "puzzle" | "keychain" | "plaque" | "apron" | "cap" | "mousepad";

export interface CustomerProduct {
  id: string;
  templateId: string;
  name: string;
  kind: CustomerProductKind;
  price: number;
  color: string;
  category: string;
  variantLabel: string;
  variants: string[];
  colors: { name: string; value: string }[];
}

const apparelColors = [
  { name: "Arena", value: "#e7c7ad" },
  { name: "Marfil", value: "#f4f0e9" },
  { name: "Oliva", value: "#a9b5a2" },
  { name: "Carbón", value: "#35363b" },
  { name: "Rosa", value: "#e6b6b2" },
  { name: "Azul", value: "#9bb6cb" },
];

export const defaultCustomerProduct: CustomerProduct = {
  id: "classic-tee",
  templateId: "tshirt",
  name: "Camiseta esencial",
  kind: "tee",
  price: 349,
  color: "#e7c7ad",
  category: "Ropa",
  variantLabel: "TALLA",
  variants: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: apparelColors,
};

export const customerProducts: CustomerProduct[] = [
  defaultCustomerProduct,
  {
    id: "everyday-hoodie",
    templateId: "hoodie",
    name: "Hoodie de diario",
    kind: "hoodie",
    price: 699,
    color: "#a9b5a2",
    category: "Ropa",
    variantLabel: "TALLA",
    variants: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: apparelColors,
  },
  {
    id: "ceramic-mug",
    templateId: "mug",
    name: "Taza de cerámica",
    kind: "mug",
    price: 279,
    color: "#f4f0e9",
    category: "Tazas",
    variantLabel: "CAPACIDAD",
    variants: ["11 oz", "15 oz"],
    colors: [
      { name: "Marfil", value: "#f4f0e9" },
      { name: "Rosa", value: "#e6b6b2" },
      { name: "Azul", value: "#9bb6cb" },
    ],
  },
  {
    id: "travel-bottle",
    templateId: "tumbler",
    name: "Termo viajero",
    kind: "bottle",
    price: 429,
    color: "#aebac7",
    category: "Termos",
    variantLabel: "CAPACIDAD",
    variants: ["20 oz", "30 oz"],
    colors: [
      { name: "Azul", value: "#aebac7" },
      { name: "Marfil", value: "#f4f0e9" },
      { name: "Carbón", value: "#35363b" },
      { name: "Rosa", value: "#e6b6b2" },
    ],
  },
  {
    id: "canvas-tote",
    templateId: "tote",
    name: "Bolsa de lona",
    kind: "tote",
    price: 319,
    color: "#d8c6a9",
    category: "Accesorios",
    variantLabel: "TAMAÑO",
    variants: ["Unitalla"],
    colors: [{ name: "Lona natural", value: "#d8c6a9" }],
  },
  {
    id: "art-print",
    templateId: "poster",
    name: "Póster artístico",
    kind: "poster",
    price: 399,
    color: "#edc9b4",
    category: "Hogar",
    variantLabel: "TAMAÑO",
    variants: ["30 × 40 cm", "50 × 70 cm"],
    colors: [{ name: "Papel natural", value: "#edc9b4" }],
  },
];

const additionalCustomerProducts: CustomerProduct[] = [
  {
    id: "socks",
    templateId: "socks",
    name: "Calcetines personalizados",
    kind: "socks",
    price: 0,
    color: "#f7f7f5",
    category: "Ropa",
    variantLabel: "TALLA",
    variants: ["22–24", "25–27", "28–30"],
    colors: [
      { name: "Blanco", value: "#f7f7f5" },
      { name: "Negro", value: "#35363b" },
    ],
  },
  {
    id: "pillow",
    templateId: "pillow",
    name: "Funda de cojín",
    kind: "pillow",
    price: 0,
    color: "#f7f7f5",
    category: "Hogar",
    variantLabel: "PRESENTACIÓN",
    variants: ["40 × 40 cm"],
    colors: [{ name: "Blanco", value: "#f7f7f5" }],
  },
  {
    id: "puzzle",
    templateId: "puzzle",
    name: "Rompecabezas",
    kind: "puzzle",
    price: 0,
    color: "#f7f7f5",
    category: "Hogar",
    variantLabel: "PRESENTACIÓN",
    variants: ["120 piezas"],
    colors: [{ name: "Blanco", value: "#f7f7f5" }],
  },
  {
    id: "keychain",
    templateId: "keychain",
    name: "Llavero MDF",
    kind: "keychain",
    price: 0,
    color: "#d8c6a9",
    category: "Accesorios",
    variantLabel: "PRESENTACIÓN",
    variants: ["Única"],
    colors: [{ name: "MDF natural", value: "#d8c6a9" }],
  },
  {
    id: "photo-plaque",
    templateId: "photo-plaque",
    name: "Placa fotográfica",
    kind: "plaque",
    price: 0,
    color: "#f7f7f5",
    category: "Decoración",
    variantLabel: "PRESENTACIÓN",
    variants: ["20 × 25 cm"],
    colors: [{ name: "Blanco", value: "#f7f7f5" }],
  },
  {
    id: "apron",
    templateId: "apron",
    name: "Mandil",
    kind: "apron",
    price: 0,
    color: "#f7f7f5",
    category: "Accesorios",
    variantLabel: "PRESENTACIÓN",
    variants: ["Única"],
    colors: [{ name: "Blanco", value: "#f7f7f5" }],
  },
  {
    id: "cap",
    templateId: "cap",
    name: "Gorra",
    kind: "cap",
    price: 0,
    color: "#f7f7f5",
    category: "Accesorios",
    variantLabel: "PRESENTACIÓN",
    variants: ["Única"],
    colors: [{ name: "Blanco", value: "#f7f7f5" }],
  },
  {
    id: "mousepad",
    templateId: "mousepad",
    name: "Mouse pad",
    kind: "mousepad",
    price: 0,
    color: "#a9abb0",
    category: "Accesorios",
    variantLabel: "PRESENTACIÓN",
    variants: ["22 × 18 cm"],
    colors: [{ name: "Gris", value: "#a9abb0" }],
  },
];

export function getCustomerProductTemplate(templateId: string) {
  return customerProducts.find((product) => product.templateId === templateId)
    ?? additionalCustomerProducts.find((product) => product.templateId === templateId);
}
