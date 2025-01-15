const { default: mongoose } = require("mongoose");

const cartSchema = new mongoose.Schema({
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
});

cartSchema.pre("save", async function (next) {
  const quantity = this.products.map((item) => {
    return item.quantity;
  });
  console.log({ quantity });

  quantity.forEach((item, index) => {
    if (item <= 0) {
      return (this.products[index] = null);
    }
  });
});

// This middleware is used to update the price of each Individual
// product based on the quantity added
cartSchema.pre("save", async function (next) {
  await this.populate("products.product", "price");

  this.products.forEach((item) => {
    item.totalPriceInd = Math.round(item.quantity * item.product?.price) || 0;
  });
  next();
});

// This middleware is used to calculate the total quantity of all products
// in the cart
cartSchema.pre("save", async function (next) {
  const quantity = this.products.map((item) => {
    return item.quantity;
  });
  // console.log({ quantity });

  this.totalQuantity = quantity.reduce((acc, curr) => acc + curr, 0);

  // console.log(this.totalQuantity);

  next();
});

// This middleware is used to calculate the total price of all products in
// the cart
cartSchema.pre("save", async function (next) {
  const totalPrice = this.products.map((item) => {
    return item.totalPriceInd;
  });

  this.totalPrice = totalPrice.reduce((acc, curr) => acc + curr, 0);

  next();
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
