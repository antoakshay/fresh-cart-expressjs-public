const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const sendOrderEmail = require("../utils/emailOrderSummary");
const ObjectId = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");

exports.postOrder = async function (req, res) {
  try {
    const getCart = await Cart.findOne({ user: req.user._id });

    // CHECKING IF THE CART IS EMPTY
    if (getCart.products.length === 0) {
      return res.status(400).json({
        status: "Fail",
        message: "Your cart is empty. Please add items to proceed.",
      });
    }
    const addressLine1 = req.body.addressLine1;
    const addressLine2 = req.body.addressLine2;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const phoneNumber = req.body.phoneNumber;
    let cartData = getCart.toObject();

    // CHECKING IF THE PRODUCT IS SOLD OUT, OR THE CART QUANTITY EXCEEDING THE
    // PRODUCT QUANTITY
    const checkIfSoldOut = cartData.products;

    const soldOutValidations = checkIfSoldOut.map(async (obj) => {
      const product = await Product.findOne({ _id: obj.product });
      console.trace(product);
      if (product.soldOut || obj.quantity > product.quantity) {
        throw new Error("Product is sold out");
      }
    });
    await Promise.all(soldOutValidations);

    // PLACING THE ORDER

    // Deleting the cartId as it gets stored as the uniqueObjectId for the
    // order Document. Also adding the address from the req.body

    cartData.addressLine1 = addressLine1;
    cartData.addressLine2 = addressLine2;
    cartData.city = city;
    cartData.pincode = pincode;
    cartData.phoneNumber = phoneNumber;
    delete cartData._id;
    delete cartData.__v;

    console.log(cartData);

    const createOrder = new Order(cartData);
    await createOrder.generateOrderId();
    await createOrder.save();

    // CLEARING THE CART AFTER PLACING THE ORDER
    const cart = await Cart.findOne({ user: req.user._id });
    cart.products = [];
    cart.totalQuantity = 0;
    cart.totalPrice = 0;
    await cart.save();
    // console.log(cart.products);

    // UPDATING THE QUANTITY NUMBER IN THE PRODUCT MODEL

    let orderedProducts = cartData.products;

    const productId = orderedProducts.map((product) => {
      return { product: product.product, quantity: product.quantity };
    });

    const productQuantityUpdatePromises = productId.map(async (product) => {
      return Product.updateOne(
        {
          _id: new ObjectId(product.product),
        },
        { $inc: { quantity: -product.quantity } }
      );
    });

    // waiting for all the promises to resolve
    await Promise.all(productQuantityUpdatePromises);

    // SETTING THE SOLD OUT PROPERTY IF THE QUANTITY GOES TO 0

    const productIdForSoldOut = productId.map((product) => {
      return { product: product.product };
    });
    // console.trace(productIdForSoldOut);
    // // console.dir(productIdForSoldOut, { depth: null });

    const soldOut = productIdForSoldOut.map(async (productId) => {
      const product = await Product.findOne({
        _id: new ObjectId(productId.product),
      });
      // console.dir(`PRODUCT ID FOR SOLDOUT ${product}`);
      await product.setSoldOut();
    });
    // waiting for all the promises to resolve
    await Promise.all(soldOut);

    // ! AS THERE IS MANY ORDERiD ASSOCIATED WITH ONE USER ID
    // ! FILTERING THE LATEST ORDERiD BY SORTING ASSCOCIATED WITH THE USER ID
    const order = await Order.findOne({ user: req.user._id })
      .populate({
        path: "products.product",
        select: "name",
      })
      .populate({
        path: "user",
        select: "email",
      })
      .sort({ _id: -1 });

    console.trace(order);

    const name = order.products.map((product) => {
      return {
        product: product.product.name,
        quantity: product.quantity,
        price: product.totalPriceInd,
      };
    });
    console.trace(name);

    const text = name
      .map((item) => `${item.quantity}x ${item.product} ${item.price}$`)
      .join(",");

    console.trace(text);

    const finalBill = order.totalPrice.toString();
    console.trace(finalBill);

    await sendOrderEmail(
      {
        email: order.user.email,
        subject: `Your Order Summary For the Order #${order.orderId}`,
        message: text,
      },
      finalBill
    );

    res.status(200).json({
      status: "OK",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: err.message,
    });
  }
};

exports.getLatestOrder = async function (req, res) {
  try {
    // ! AS THERE IS MANY ORDERiD ASSOCIATED WITH ONE USER ID
    // ! FILTERING THE LATEST ORDERiD BY SORTING ASSCOCIATED WITH THE USER ID
    const order = await Order.findOne({ user: req.user._id })
      .populate({
        path: "products.product",
        select: "name",
      })
      .sort({ _id: -1 });

    // console.log(order.schema.obj);

    res.status(200).json({
      status: "OK",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      message: err.message || "Something went wrong",
    });
  }
};

exports.trackOrder = async function (req, res) {
  const orderId = req.body.orderId;

  console.log(orderId);
  try {
    const order = await Order.findOne({ orderId: orderId })
      .select("-user")
      .select("-orderId")
      .select("-address")
      .select("-__v")
      // .select("-_id")
      .select("-products._id")
      .populate("products.product", "name -_id")
      .populate("user", "name -_id");
    // .select("-products.product._id");

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    await order.calculateOrderStatus();
    // await order.save();
    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

exports.getOrdersByUserId = async function (req, res) {
  try {
    let token = req.cookies.jwt;
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const orders = await Order.find({ user: userId })
      .select(
        "products.quantity products.totalPriceInd totalQuantity totalPrice orderDate orderStatus orderId"
      )
      .populate("products.product", "name");
    if (!orders) {
      throw new Error("No Order history found");
    }
    res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
