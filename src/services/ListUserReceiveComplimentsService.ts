import { AppDataSource } from "../database";
import { Compliments } from "../entities/Compliments";
import { presentCompliment } from "../presenters/ComplimentPresenter";

class ListUserReceiveComplimentsService {
  async execute(user_id: string) {
    const complimentsRepository = AppDataSource.getRepository(Compliments);

    const compliments = await complimentsRepository.find({
      where: {
        user_receiver: user_id,
      },
      relations: ["userSender", "userReceiver", "tag"],
    });

    return compliments.map(presentCompliment);
  }
}

export { ListUserReceiveComplimentsService };
