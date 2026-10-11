import "reflect-metadata";

import { mkdirSync } from "fs";
import { dirname, resolve, basename } from "path";
import { DataSource } from "typeorm";

const compiled = basename(dirname(__dirname)) === "dist";
const extension = compiled ? "js" : "ts";
const databasePath = resolve(process.cwd(), "database", "app.sqlite");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: databasePath,
  entities: [resolve(__dirname, "../entities", `*.${extension}`)],
  migrations: [resolve(__dirname, "migrations", `*.${extension}`)],
  migrationsRun: true,
  synchronize: false,
});

export async function initializeDatabase(): Promise<void> {
  process.umask(0o077);
  mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}
