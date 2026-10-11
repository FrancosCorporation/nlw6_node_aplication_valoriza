import { Compliments } from "../entities/Compliments";

export function presentCompliment(compliment: Compliments) {
  return {
    id: compliment.id,
    message: compliment.message,
    created_at: compliment.created_at,
    sender: compliment.userSender
      ? { id: compliment.userSender.id, name: compliment.userSender.name }
      : { id: compliment.user_sender },
    recipient: compliment.userReceiver
      ? { id: compliment.userReceiver.id, name: compliment.userReceiver.name }
      : { id: compliment.user_receiver },
    tag: compliment.tag
      ? { id: compliment.tag.id, name: compliment.tag.name }
      : { id: compliment.tag_id },
  };
}
