import "reflect-metadata";

import express, { NextFunction, Request, Response } from "express";
import { appConfig } from "./config/env";
import { initializeDatabase } from "./database";
import { AppError } from "./errors/AppError";
import { router } from "./routes";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.use(router);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    next: NextFunction
  ) => {
    if (response.headersSent) {
      return next(error);
    }
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({ error: error.message });
    }
    if (typeof error === "object" && error !== null && "status" in error) {
      const bodyError = error as { status?: unknown; type?: unknown };
      if (bodyError.status === 413) {
        return response.status(413).json({ error: "Corpo da requisição muito grande." });
      }
      if (bodyError.status === 400 && bodyError.type === "entity.parse.failed") {
        return response.status(400).json({ error: "JSON inválido." });
      }
    }
    console.error(error);
    return response.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
);

async function startServer(): Promise<void> {
  await initializeDatabase();
  app.listen(appConfig.port, () => {
    console.log(`API pronta em http://localhost:${appConfig.port}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error("Não foi possível iniciar a API:", error);
  process.exit(1);
});
