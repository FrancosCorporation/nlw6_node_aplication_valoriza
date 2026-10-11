import { AppDataSource } from "../database";
import { AppError } from "../errors/AppError";
import { Tag } from "../entities/Tag";

class CreateTagService {
  async execute(name: string) {
    const tagsRepositories = AppDataSource.getRepository(Tag);
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!normalizedName) {
      throw new AppError("Nome da tag é obrigatório.");
    }

    const tagAlreadyExists = await tagsRepositories.findOne({
      where: { name: normalizedName },
    });

    if (tagAlreadyExists) {
      throw new AppError("Essa tag já existe.", 409);
    }

    const tag = tagsRepositories.create({
      name: normalizedName,
    });

    await tagsRepositories.save(tag);

    return tag;
  }
}

export { CreateTagService };
