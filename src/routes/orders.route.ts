import mongoose from "mongoose";
import express, { Router, Request, Response } from "express";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  OrderStatus,
  NotFoundError,
  BadRequestError,
  NotAuthorizedError,
} from "@stagefirelabs/common";

import { Order } from "../models/order.model";
import { Ticket } from "../models/ticket.model";

import { natsWrapper } from "../nats.wrapper";

const router: Router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const orders = await Order.find({
    userid: req.currentUser!.id,
  }).populate("ticket");

  res.send(orders);
});

router.delete("/:orderId", requireAuth, async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  order.status = OrderStatus.CANCELLED;
  await order.save();
  res.status(204).send(order);
});

router.get("/:orderId", requireAuth, async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.orderId).populate("ticket");
  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  res.send(order);
});

router.post(
  "/",
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("TicketId must be provided"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    const existingOrder = await Order.findOne({
      ticket: ticket,
      status: {
        $in: [
          OrderStatus.CREATED,
          OrderStatus.AWAITING_PAYMENT,
          OrderStatus.COMPLETE,
        ],
      },
    });
    if (existingOrder) {
      throw new BadRequestError("Ticket is already reserevd");
    }

    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.CREATED,
      expiresAt: expiration,
      ticket,
    });

    await order.save();

    res.status(201).send(order);
  }
);

export { router as ordersRouter };
