import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

import { AppDataSource } from "../database";
import { appConfig } from "../config/env";
import { AppError } from "../errors/AppError";
import { User } from "../entities/User";

interface IAuthenticateRequest {
  email: string;
  password: string;
}

class AuthenticateUserService {
  async execute({ email, password }: IAuthenticateRequest) {
    const usersRepository = AppDataSource.getRepository(User);

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = await usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    const passwordMatch = user && typeof password === "string"
      ? await compare(password, user.password)
      : false;

    if (!passwordMatch) {
      throw new AppError("Email ou senha inválidos.", 401);
    }

    const token = sign(
      {
        email: user.email,
      },
      appConfig.jwtSecret,
      {
        algorithm: "HS256",
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return token;
  }
}

export { AuthenticateUserService };
