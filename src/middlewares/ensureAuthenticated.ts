import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { appConfig } from "../config/env";

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verify(match[1], appConfig.jwtSecret, {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return response.status(401).json({ error: "Unauthorized" });
    }
    request.user_id = payload.sub;
    return next();
  } catch {
    return response.status(401).json({ error: "Unauthorized" });
  }
}
