import { hash } from "bcryptjs";
import { AppDataSource } from "../database";
import { AppError } from "../errors/AppError";
import { User } from "../entities/User";

interface IUserRequest {
  name: string;
  email: string;
  password: string;
}

class CreateUserService {
  async execute({ name, email, password }: IUserRequest) {
    const usersRepository = AppDataSource.getRepository(User);
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName) {
      throw new AppError("Nome é obrigatório.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError("E-mail inválido.");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new AppError("A senha deve ter ao menos 8 caracteres.");
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new AppError("A senha não pode exceder 72 bytes.");
    }

    const userAlreadyExists = await usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (userAlreadyExists) {
      throw new AppError("Já existe uma conta com esse e-mail.", 409);
    }

    const passwordHash = await hash(password, 12);

    const user = usersRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      admin: false,
      password: passwordHash,
    });

    await usersRepository.save(user);

    return user;
  }
}

export { CreateUserService };
