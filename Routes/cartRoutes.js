const express = require("express");
const cartController = require("../Controller/cartController");
const authController = require("../Controller/authernticationController");

const cartRouter = express.Router();

/* cartRouter.post(
  "/addProduct",
  authController.protect,
  cartController.addProductToCart
); */
cartRouter.get("/getCartById", authController.protect, cartController.getCartById);
cartRouter.patch(
  "/updateCart",
  authController.protect,
  cartController.updateCart
);

cartRouter.patch(
  "/deleteCart",
  authController.protect,
  cartController.deleteCart
);

cartRouter.patch(
  "/removeProduct",
  authController.protect,
  cartController.deleteIndividualProd
);
// console.trace("route reached");

// FOR TESTING THE POPULATE METHODS ONLY NOT A REAL ROUTE
cartRouter.get("/getCart", authController.protect, cartController.getCart);

module.exports = cartRouter;
