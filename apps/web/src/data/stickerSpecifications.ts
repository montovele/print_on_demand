export interface StickerOptionGroup {
  label: string;
  options: string[];
}

export interface StickerSpecifications {
  dimensions: string[];
  materials: string[];
  optionGroups: StickerOptionGroup[];
  productionNotes: string[];
}

export const stickerSpecifications: Record<string, StickerSpecifications> = {
  "stickers-con-nombre-y-bandera": {
    dimensions: ["S: 8.5 × 1 cm (24 piezas)", "M: 12.5 × 1.5 cm (12 piezas)", "L: 16.5 × 2 cm (4 piezas)", "XL: 23.5 × 3 cm (4 piezas)"],
    materials: ["Vinil reflejante 3M grado ingeniería", "Vinil transparente"],
    optionGroups: [
      { label: "Nombres", options: ["Un nombre", "Dos nombres personalizados"] },
      { label: "Tipografía", options: ["Estándar", "Serif", "Sport"] },
      { label: "Acabado", options: ["Barniz UV sectorizado con relieve"] },
    ],
    productionNotes: ["Planilla con 44 stickers en cuatro tamaños.", "El proveedor describe resistencia a agua, sol e intemperie."],
  },
  "stickers-con-relieve": {
    dimensions: ["La ficha no publica dimensiones físicas; confirma el tamaño final antes de producir."],
    materials: ["Vinil impreso con barniz UV localizado"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma estándar", "Contorno personalizado"] },
      { label: "Relieve", options: ["Barniz brillante", "Barniz mate"] },
    ],
    productionNotes: ["La ficha describe impresión UV y prueba digital del diseño."],
  },
  "stickers-espejo": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Material con acabado reflectante tipo espejo", "Laminado protector"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Color del material", options: ["Dorado", "Plata"] },
      { label: "Tinta", options: ["Base blanca + color", "Sin tinta blanca", "Solo tinta blanca"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["El proveedor describe laminado protector y uso en exteriores."],
  },
  "stickers-fantasy-glitter": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Sustrato holográfico Fantasy Glitter"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "300", "500", "1,000"] },
      { label: "Corte", options: ["Forma estándar", "Contorno personalizado"] },
      { label: "Tinta", options: ["Base blanca + color", "Sin tinta blanca", "Solo tinta blanca"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["La ficha describe impresión digital a color y tintas UV."],
  },
  "stickers-fibra-de-carbono": {
    dimensions: ["5 × 5 cm", "7.5 × 7.5 cm", "10 × 10 cm", "12.5 × 12.5 cm"],
    materials: ["Vinil con patrón visual de fibra de carbono"],
    optionGroups: [
      { label: "Tamaño", options: ["5 × 5 cm", "7.5 × 7.5 cm", "10 × 10 cm", "12.5 × 12.5 cm"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["El proveedor describe impresión con tintas UV."],
  },
  "stickers-glow-in-the-dark": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil fotoluminiscente"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma geométrica", "Contorno personalizado"] },
    ],
    productionNotes: ["El material requiere exposición a la luz para brillar en la oscuridad."],
  },
  "stickers-holograficos": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Sustrato holográfico con efecto arcoíris"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma estándar", "Contorno personalizado"] },
      { label: "Tinta", options: ["Base blanca + color", "Sin tinta blanca", "Solo tinta blanca"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["La ficha describe tintas UV y aplicación en exteriores."],
  },
  "stickers-metalicos": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Sustrato metálico"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Color del material", options: ["Dorado", "Plata"] },
      { label: "Corte", options: ["Forma estándar", "Contorno personalizado"] },
      { label: "Tinta", options: ["Base blanca + color", "Sin tinta blanca", "Solo tinta blanca"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["La ficha describe tintas UV para exposición a elementos."],
  },
  "stickers-para-auto-bumper-stickers": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil premium", "Laminado mate"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Diseño y corte", options: ["Mensaje o ilustración", "Forma estándar", "Contorno personalizado"] },
    ],
    productionNotes: ["El proveedor describe resistencia al sol, agua, rayones y rayos UV."],
  },
  "stickers-para-piso-floor-graphics": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil adhesivo de alta adherencia"],
    optionGroups: [
      { label: "Cantidad", options: ["1", "5", "10", "25", "50", "100"] },
      { label: "Laminado", options: ["Mate", "Antiderrapante"] },
      { label: "Forma", options: ["Redonda", "Cuadrada", "Rectangular", "Ovalada", "Contorno personalizado"] },
    ],
    productionNotes: ["La ficha informa un estimado de cuatro días hábiles tras aprobar el diseño; puede variar por tamaño y cantidad."],
  },
  "stickers-reflejantes": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil reflejante"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma geométrica", "Contorno personalizado"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["El proveedor describe resistencia a rayones y rayos UV."],
  },
  "stickers-reversibles-adhesivo-frontal": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil de alta adherencia", "Laminado blanco o transparente"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "300", "500", "1,000"] },
      { label: "Impresión", options: ["En espejo para lectura desde el exterior"] },
      { label: "Laminado", options: ["Blanco", "Transparente"] },
      { label: "Corte", options: ["Troquelado individual según diseño"] },
    ],
    productionNotes: ["Pensados para instalarse en la cara interior del vidrio.", "La ficha estima de tres a cinco días hábiles después de aprobar la muestra."],
  },
  "stickers-semi-troqueladas-kiss-cut": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["La ficha contiene información que parece corresponder a stickers transparentes; el material requiere confirmación."],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Semi troquelado Kiss-Cut (confirmar con el proveedor)"] },
    ],
    productionNotes: ["La descripción publicada menciona material transparente, laminado mate, tinta blanca y resistencia UV; puede no corresponder al título Kiss-Cut."],
  },
  "stickers-transferibles": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Vinil de corte con película de transferencia"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "300", "500", "1,000"] },
      { label: "Color", options: ["Blanco", "Negro", "Dorado mate", "Plata mate"] },
    ],
    productionNotes: ["La ficha indica una duración exterior estimada de hasta cinco años."],
  },
  "stickers-transparentes": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Material transparente", "Laminado mate"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma geométrica", "Contorno personalizado"] },
      { label: "Tinta", options: ["Base blanca + color", "Sin tinta blanca", "Solo tinta blanca"] },
      { label: "Acabado", options: ["Relieve con barniz brillante", "Relieve con barniz mate", "Sin acabados"] },
    ],
    productionNotes: ["La ficha describe resistencia a rayones, sol y agua; indica cuatro días hábiles después de aprobar el diseño."],
  },
  "stikers-troqueladas-die-cut": {
    dimensions: ["La ficha no especifica dimensiones físicas."],
    materials: ["Material adhesivo impreso a color", "Laminado mate"],
    optionGroups: [
      { label: "Cantidad", options: ["25", "50", "100", "200", "500", "1,000", "5,000", "10,000"] },
      { label: "Corte", options: ["Forma geométrica", "Contorno personalizado"] },
    ],
    productionNotes: ["La ficha describe protección contra rayos UV y rayones, y un plazo estimado de cuatro días hábiles tras aprobar la prueba."],
  },
};
