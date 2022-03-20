import { Publisher, Subjects, OrderCreatedEvent } from "@stagefirelabs/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
}
