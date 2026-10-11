import { AppDataSource } from "../database";
import { AppError } from "../errors/AppError";
import { Compliments } from "../entities/Compliments";
import { Tag } from "../entities/Tag";
import { User } from "../entities/User";

interface IComplimentRequest {
  tag_id: string;
  user_sender: string;
  user_receiver: string;
  message: string;
}

class CreateComplimentService {
  async execute({
    tag_id,
    user_sender,
    user_receiver,
    message,
  }: IComplimentRequest) {
    const complimentsRepository = AppDataSource.getRepository(Compliments);
    const usersRepository = AppDataSource.getRepository(User);
    const tagsRepository = AppDataSource.getRepository(Tag);

    if (
      typeof user_sender !== "string" ||
      !user_sender ||
      typeof user_receiver !== "string" ||
      !user_receiver ||
      typeof tag_id !== "string" ||
      !tag_id
    ) {
      throw new AppError("Destinatário e tag são obrigatórios.");
    }
    if (user_sender === user_receiver) {
      throw new AppError("Não é possível enviar um elogio para si mesmo.");
    }

    if (typeof message !== "string" || !message.trim() || message.length > 1000) {
      throw new AppError("A mensagem deve ter entre 1 e 1000 caracteres.");
    }

    const userReceiverExists = await usersRepository.findOne({
      where: { id: user_receiver },
    });

    if (!userReceiverExists) {
      throw new AppError("Destinatário não encontrado.", 404);
    }

    const tagExists = await tagsRepository.findOne({
      where: { id: tag_id },
    });
    if (!tagExists) {
      throw new AppError("Tag não encontrada.", 404);
    }

    const compliment = complimentsRepository.create({
      tag_id,
      user_receiver,
      user_sender,
      message,
    });

    compliment.message = message.trim();
    await complimentsRepository.save(compliment);

    return compliment;
  }
}

export { CreateComplimentService };
