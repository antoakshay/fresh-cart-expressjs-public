const mongoose = require("mongoose");
const validator = require("validator");

const moment = require("moment");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    min: 6,
    max: 10,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  products: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
      quantity: Number,
      totalPriceInd: Number,
    },
  ],

  totalQuantity: { type: Number, default: 0 },
  totalPrice: {
    type: Number,
    default: 0,
  },
  addressLine1: { type: String, required: true, max: 100, min: 30 },
  addressLine2: { type: String, required: true, max: 100, min: 30 },
  city: { type: String, required: true, max: 50, min: 20 },
  pincode: { type: String, required: true, max: 15, min: 4 },

  phoneNumber: {
    type: String,
    required: true,
    validate: [validator.isMobilePhone, "Please provide a valid phone number"],
  },
  orderDate: { type: Date, default: Date.now() },
  orderStatus: {
    type: String,
    enum: ["pending", "delivered"],
    default: function () {
      return this.orderDate > Date.now() + 30 * 60 * 1000
        ? "delivered"
        : "pending";
    },
  },
});

// Generating a random orderId when a user places a order
orderSchema.methods.generateOrderId = async function (next) {
  const randomInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  this.orderId = Math.random()
    .toString(36)
    .slice(2, 2 + randomInteger(6, 10));
};

orderSchema.methods.calculateOrderStatus = async function () {
  let placedOrderDate = this.orderDate;
  let modifiedOrderDate = moment(this.orderDate).add(30, "m").toDate();

  console.log(placedOrderDate, modifiedOrderDate);
  if (moment(new Date()).isBetween(placedOrderDate, modifiedOrderDate)) {
    this.orderStatus = "pending";
  } else {
    this.orderStatus = "delivered";
  }
  await this.save();
};

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
