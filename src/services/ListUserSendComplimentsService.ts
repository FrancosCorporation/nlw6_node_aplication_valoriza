import { AppDataSource } from "../database";
import { Compliments } from "../entities/Compliments";
import { presentCompliment } from "../presenters/ComplimentPresenter";

class ListUserSendComplimentsService {
  async execute(user_id: string) {
    const complimentsRepository = AppDataSource.getRepository(Compliments);

    const compliments = await complimentsRepository.find({
      where: {
        user_sender: user_id,
      },
      relations: { userSender: true, userReceiver: true, tag: true },
    });

    return compliments.map(presentCompliment);
  }
}

export { ListUserSendComplimentsService };
