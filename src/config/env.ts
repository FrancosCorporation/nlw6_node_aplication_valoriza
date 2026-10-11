import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET?.trim();
if (!jwtSecret || Buffer.byteLength(jwtSecret, "utf8") < 32) {
  throw new Error("JWT_SECRET deve conter ao menos 32 bytes aleatórios.");
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve ser um número inteiro entre 1 e 65535.");
}

export const appConfig = Object.freeze({ jwtSecret, port });
