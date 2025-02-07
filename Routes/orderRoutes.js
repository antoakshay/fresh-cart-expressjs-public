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

orderRouter.post(
  "/trackOrder",
  authenticationController.protect,
  orderController.trackOrder
);

orderRouter.post(
  "/getAllOrderHistory", 
  authenticationController.protect,
  orderController.getOrdersByUserId
);

module.exports = orderRouter;
