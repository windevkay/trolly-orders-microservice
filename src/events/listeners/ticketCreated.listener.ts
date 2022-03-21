import { Message } from "node-nats-streaming";

import { Subjects, Listener, TicketCreatedEvent } from "@stagefirelabs/common";

import { Ticket } from "../../models/ticket.model";
import { queueGroupName } from "./constants";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketCreatedEvent["data"], msg: Message) {
    const { id, title, price } = data;
    //duplicated data needs to have same id's
    const ticket = Ticket.build({ id, title, price });
    await ticket.save();

    msg.ack();
  }
}
