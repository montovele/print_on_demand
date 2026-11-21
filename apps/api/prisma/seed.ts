import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "../src/config.js";

const prisma = new PrismaClient();

const demoProducts = [
  {
    id: "demo-classic-tshirt",
    name: "DEMO · Camiseta clásica",
    productType: "tshirt",
    description: "Producto de demostración para probar el diseñador y la publicación de la tienda.",
    productionMethod: "DTG",
    baseCost: 140,
    defaultProductColor: "Blanco",
    colors: ["Blanco", "Negro"],
    variants: ["S", "M", "L"],
    salePrice: 349,
  },
  {
    id: "demo-ceramic-mug",
    name: "DEMO · Taza de cerámica",
    productType: "mug",
    description: "Producto de demostración para probar el diseñador y la publicación de la tienda.",
    productionMethod: "Sublimación",
    baseCost: 90,
    defaultProductColor: "Blanco",
    colors: ["Blanco"],
    variants: ["11 oz", "15 oz"],
    salePrice: 249,
  },
  {
    id: "demo-travel-tumbler",
    name: "DEMO · Termo viajero",
    productType: "tumbler",
    description: "Producto de demostración para probar el diseñador y la publicación de la tienda.",
    productionMethod: "Sublimación",
    baseCost: 210,
    defaultProductColor: "Negro",
    colors: ["Blanco", "Negro"],
    variants: ["20 oz", "30 oz"],
    salePrice: 449,
  },
  {
    id: "demo-socks",
    name: "DEMO · Calcetines personalizados",
    productType: "socks",
    description: "Producto de demostración para probar el diseñador y la publicación de la tienda.",
    productionMethod: "Sublimación",
    baseCost: 75,
    defaultProductColor: "Blanco",
    colors: ["Blanco", "Negro"],
    variants: ["22–24", "25–27", "28–30"],
    salePrice: 199,
  },
] as const;

async function seedDemoProducts(tenantId: string) {
  for (const product of demoProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        tenantId,
        name: product.name,
        description: product.description,
        providerCode: null,
        externalProductId: null,
        fulfillmentMode: "in_house",
        productType: product.productType,
        productionMethod: product.productionMethod,
        baseCost: product.baseCost,
        salePrice: product.salePrice,
        currency: "MXN",
        designConfig: {
          color: "#f7f7f5",
          text: "",
          textColor: "#252632",
          textColorOptions: ["#252632", "#ffffff"],
          customerDesignerOptions: {
            productColors: true,
            printTextColors: true,
            text: true,
            artwork: true,
            sides: true,
            transform: true,
          },
          defaultProductColor: product.defaultProductColor,
          scale: 72,
          x: 50,
          y: 48,
          rotation: 0,
          side: "front",
        },
      },
      create: {
        id: product.id,
        tenantId,
        name: product.name,
        description: product.description,
        status: "ready",
        fulfillmentMode: "in_house",
        productType: product.productType,
        productionMethod: product.productionMethod,
        baseCost: product.baseCost,
        salePrice: product.salePrice,
        currency: "MXN",
        designConfig: {
          color: "#f7f7f5",
          text: "",
          textColor: "#252632",
          textColorOptions: ["#252632", "#ffffff"],
          customerDesignerOptions: {
            productColors: true,
            printTextColors: true,
            text: true,
            artwork: true,
            sides: true,
            transform: true,
          },
          defaultProductColor: product.defaultProductColor,
          scale: 72,
          x: 50,
          y: 48,
          rotation: 0,
          side: "front",
        },
      },
    });

    for (const color of product.colors) {
      for (const size of product.variants) {
        const variantId = `${product.id}-${color.toLowerCase()}-${size.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
        await prisma.productVariant.upsert({
          where: { id: variantId },
          update: {
            name: `${product.name.replace("DEMO · ", "")} · ${size} · ${color}`,
            size,
            color,
            providerCost: product.baseCost,
            salePrice: product.salePrice,
            currency: "MXN",
          },
          create: {
            id: variantId,
            productId: product.id,
            name: `${product.name.replace("DEMO · ", "")} · ${size} · ${color}`,
            size,
            color,
            providerCost: product.baseCost,
            salePrice: product.salePrice,
            currency: "MXN",
          },
        });
      }
    }
  }
}

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.log("Seed skipped: set SEED_EMAIL and SEED_PASSWORD to create a demo account.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name: "Demo Seller", passwordHash },
    create: { email: email.toLowerCase(), name: "Demo Seller", passwordHash },
  });
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-store" },
    update: { name: "Demo Store" },
    create: { name: "Demo Store", slug: "demo-store" },
  });
  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { role: "owner" },
    create: { userId: user.id, tenantId: tenant.id, role: "owner" },
  });
  await seedDemoProducts(tenant.id);
  console.log(`Created/updated demo account ${email} and four demo products for tenant ${tenant.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
