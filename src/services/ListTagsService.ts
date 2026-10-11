import { instanceToPlain } from "class-transformer";
import { AppDataSource } from "../database";
import { Tag } from "../entities/Tag";

class ListTagsService {
  async execute() {
    const tagsRepositories = AppDataSource.getRepository(Tag);

    const tags = await tagsRepositories.find();

    return instanceToPlain(tags);
  }
}

export { ListTagsService };
