import { Message } from "node-nats-streaming";

import {
  Subjects,
  Listener,
  ExpirationCompleteEvent,
  OrderStatus,
} from "@stagefirelabs/common";

import { Order } from "../../models/order.model";
import { queueGroupName } from "./constants";

import { OrderCancelledPublisher } from "../publishers";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent["data"], msg: Message) {
    const { orderId } = data;
    const order = await Order.findById(orderId).populate("ticket");
    if (!order) throw new Error("Order not found");

    order.set({
      status: OrderStatus.CANCELLED,
    });
    await order.save();
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });
    msg.ack();
  }
}
