import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../database";
import { User } from "../entities/User";

export async function ensureAdmin(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const userId = request.user_id;
  if (!userId) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
  });
  if (!user) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  if (!user.admin) {
    return response.status(403).json({ error: "Forbidden" });
  }
  return next();
}
