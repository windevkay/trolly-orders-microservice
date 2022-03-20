import {
  Publisher,
  Subjects,
  OrderCancelledEvent,
} from "@stagefirelabs/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
