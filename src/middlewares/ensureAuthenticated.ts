import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { appConfig } from "../config/env";
import { AppDataSource } from "../database";
import { User } from "../entities/User";

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  let userId: string;
  try {
    const payload = verify(match[1], appConfig.jwtSecret, {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return response.status(401).json({ error: "Unauthorized" });
    }
    userId = payload.sub;
  } catch {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const user = await AppDataSource.getRepository(User).findOne({
    select: { id: true },
    where: { id: userId },
  });
  if (!user) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  request.user_id = user.id;
  return next();
}
