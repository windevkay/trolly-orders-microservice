import mongoose from "mongoose";
import { Message } from "node-nats-streaming";

import { TicketCreatedEvent } from "@stagefirelabs/common";

import { TicketCreatedListener } from "../ticketCreated.listener";
import { natsWrapper } from "../../../nats.wrapper";
import { Ticket } from "../../../models/ticket.model";

const setup = async () => {
  const listener = new TicketCreatedListener(natsWrapper.client);

  const data: TicketCreatedEvent["data"] = {
    version: 0,
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it("creates and saves a Ticket", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  if (ticket) {
    expect(ticket.price).toEqual(data.price);
    expect(ticket.title).toEqual(data.title);
  }
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});