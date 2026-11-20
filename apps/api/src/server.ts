import { app } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./database.js";

const server = await startServer();

async function startServer() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const errorCode = typeof error === "object" && error !== null && "errorCode" in error
      ? String(error.errorCode)
      : undefined;
    const diagnostic = errorCode === "P1000"
      ? "MySQL rechazó las credenciales de DATABASE_URL."
      : errorCode === "P1003"
        ? "La base de datos indicada en DATABASE_URL no existe."
        : errorCode === "P1010"
          ? "El usuario de DATABASE_URL no tiene acceso a la base de datos indicada."
          : errorCode === "P1001" || errorCode === "P1002"
            ? "No se pudo alcanzar MySQL. Comprueba que el servicio y el puerto configurado estén disponibles."
            : "No se pudo conectar a MySQL. Comprueba el servicio y la configuración DATABASE_URL.";
    console.error(diagnostic);
    if (errorCode) console.error(`Prisma error code: ${errorCode}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  return app.listen(config.API_PORT, () => {
    console.log(`POD API listening on http://localhost:${config.API_PORT}`);
  });
}

async function shutdown(signal: string) {
  console.log(`${signal} received; closing API`);
  server.close(async (error) => {
    if (error) {
      console.error("Failed to close HTTP server cleanly", error);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
    process.exit();
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
