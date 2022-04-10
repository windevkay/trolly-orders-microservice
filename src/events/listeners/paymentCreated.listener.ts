import { Message } from "node-nats-streaming";

import {
  Subjects,
  Listener,
  PaymentCreatedEvent,
  OrderStatus,
} from "@stagefirelabs/common";

import { Order } from "../../models/order.model";
import { queueGroupName } from "./constants";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
    const order = await Order.findById(data.orderId);
    if (!order) throw new Error("Order not found");

    order.set({
      status: OrderStatus.COMPLETE,
    });
    await order.save();

    msg.ack();
  }
}
