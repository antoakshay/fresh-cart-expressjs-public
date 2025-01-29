const express = require("express");
const orderRouter = express.Router();
const orderController = require("../Controller/orderController");
const authenticationController = require("../Controller/authernticationController");
orderRouter.post(
  "/placeOrder",
  authenticationController.protect,
  orderController.postOrder
);
orderRouter.get(
  "/getLatestOrder",
  authenticationController.protect,
  orderController.getLatestOrder
);

orderRouter.get(
  "/trackOrder",
  authenticationController.protect,
  orderController.trackOrder
);

orderRouter.get(
  "/getAllUserOrders",
  authenticationController.protect,
  orderController.getOrdersByUserId
);

module.exports = orderRouter;
