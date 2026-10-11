import { hash } from "bcryptjs";
import "../config/env";
import { AppDataSource, initializeDatabase } from "../database";
import { AppError } from "../errors/AppError";
import { User } from "../entities/User";

async function createAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new AppError(
      "Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente."
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("ADMIN_EMAIL inválido.");
  }
  if (password.length < 12) {
    throw new AppError("ADMIN_PASSWORD deve ter ao menos 12 caracteres.");
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError("ADMIN_PASSWORD não pode exceder 72 bytes.");
  }

  await initializeDatabase();
  try {
    const users = AppDataSource.getRepository(User);
    if (await users.findOne({ where: { email } })) {
      throw new AppError(
        "Já existe uma conta com esse e-mail; o comando não altera contas existentes.",
        409
      );
    }
    await users.save(
      users.create({
        name,
        email,
        password: await hash(password, 12),
        admin: true,
      })
    );
    console.log("Conta administradora criada.");
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void createAdmin().catch((error: unknown) => {
  console.error(
    error instanceof AppError ? error.message : "Não foi possível criar a conta administradora."
  );
  process.exitCode = 1;
});
