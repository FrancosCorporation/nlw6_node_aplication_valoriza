import { AppDataSource } from "../database";
import { User } from "../entities/User";

class ListUserService {
  async execute() {
    const users = await AppDataSource.getRepository(User).find({
      select: { id: true, name: true },
      order: { name: "ASC" },
    });
    return users.map(({ id, name }) => ({ id, name }));
  }
}

export { ListUserService };
