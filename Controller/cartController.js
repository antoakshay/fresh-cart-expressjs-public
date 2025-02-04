const { request } = require("express");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const { Mongoose, default: mongoose } = require("mongoose");
const ObjectId = require("mongodb").ObjectId;

exports.updateCart = async function (req, res, next) {
  try {
    // console.log(req.user._id);
    const productId = req.body.productId;
    // console.log({ productId });
    const quantity = req.body.quantity;
    // const cartId = req.params.cartId;
    //   console.log(cartId);
    const cart = await Cart.findOne({ user: req.user._id });
    const product = await Product.findById(productId);
    // console.log(cart.products[0]);

    if (product?.soldOut) {
      // Checking if the user quantity exceeds the inventory quantity
      throw new Error("The Stock is currently unavailable. Please try again");
    }

    if (quantity > product?.quantity) {
      throw new Error(
        "There is only a limited quantity in the inventory. Please reduce the quantity."
      );
    }

    if (!cart) {
      throw new Error("Cart not found");
    }

    // using the .some() to find the product matching the productId from the client
    // And also to check if the user is adding the same product
    const exsistingProduct = cart.products?.some((product) => {
      return product?.product?.toString() === productId || false;
    });

    // console.log(exsistingProduct);

    if (exsistingProduct) {
      // Updating individual product quantity
      const cart = await Cart.updateOne(
        {
          "products.product": new ObjectId(productId),
        },

        { $inc: { "products.$.quantity": quantity } }
      );

      const updateCart = await Cart.findOne({ user: req.user._id });
      await updateCart.deleteIndividualProd(productId /* , quantity */);
      await updateCart.individualPrice();

      await updateCart.totalQuantityAll();
      await updateCart.finalCartPrice();

      await updateCart.save();

      // !! COMMENTING THIS PART OUT, BECAUSE IT IS NOT ALLOWING
      // !! THE CART QUANTITY TO DISPLAY 0 IN THE FRONT-END
      // !! AND ITS USELESS TOO IN THIS CONTEXT
      //  if (updateCart.products.length === 0) {
      //   // throw new Error("Cart Is Empty Add products to cart");

      // }
      const updatedCart = await Cart.find({
        user: req.user._id,
      }).populate({
        path: "products.product",
        select: "name",
      });
      res.status(200).json({
        status: "success",
        message: "Product added to cart successfully",
        data: updatedCart,
      });
      /* ---------------------------------------------------------------- */
    } else if (quantity < 0) {
      throw new Error("Invalid quantity. Quantity should be a positive number");
    } else {
      cart.products.push({
        product: productId,
        quantity: quantity,
      });

      // await cart.deleteIndividualProd();
      await cart.individualPrice();
      await cart.totalQuantityAll();
      await cart.finalCartPrice();

      await cart.save();

      const updatedCart = await Cart.find({ user: req.user._id }).populate({
        path: "products.product",
        select: "name",
      }); /* .exec(); */ /* .lean(); */
      console.log(updatedCart);

      res.status(200).json({
        status: "success",
        message: "Product added to cart successfully",
        data: updatedCart /* .toObject(), */,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message /* || "Something went wrong" */,
      error: err,
    });
  }
};

exports.getCart = async function (req, res, next) {
  try {
    const cart = await Cart.find()
      .populate({ path: "user", select: "name email" })
      .populate({ path: "products.product", select: "name price category" });
    // console.trace(cart.products);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to get cart",
      error: err.message,
    });
  }
};

exports.deleteCart = async function (req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      throw new Error("Cart not found");
    }
    cart.products = [];
    cart.totalQuantity = 0;
    cart.totalPrice = 0;
    await cart.save();
    res.status(200).json({
      status: "success",
      message: "Products deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Something went wrong",
      error: err.message,
    });
  }
};

// For deleting products from the cart
exports.deleteIndividualProd = async function (req, res) {
  try {
    const productId = req.body.productId;

    // The user field acts as a "PARENT ID" to identify the cart document
    // the productId is stored inside a subDocument [{},{}]
    await Cart.updateOne(
      { user: req.user._id },
      { $pull: { products: { product: productId } } }
    );

    const cart = await Cart.findOne({ user: req.user._id });
    await cart.individualPrice();
    await cart.totalQuantityAll();
    await cart.finalCartPrice();
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "name soldOut",
    });

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
      data: updatedCart,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Something went wrong",
      error: err.message,
    });
  }
};

// For getting the cart for each individual user
exports.getCartById = async function (req, res) {
  // console.trace("CALL FROM REACT");
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "products.product",
      select: "name soldOut",
    });
    console.trace(cart);
    res.status(200).json({
      status: "success",
      data: cart,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to get cart",
    });
  }
};
