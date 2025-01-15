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

// This middleware deletes the product if its quantity is 0
cartSchema.methods.deleteIndividualProd = async function (
  productId /* , quantity */
) {
  // console.log("productId:", productId);
  const data = await this.constructor.findOne(this._id);
  // console.log(data.products);
  // console.log({ quantity });
  // If the validations pass, the subId gets assigned the position value of the object
  // in the products array, otherwise returns -1
  const subId = data.products.findIndex((item) => {
    //// console.log(item.product.toString());
    //!! Checking if the product is already there
    let validation = item.product.toString() === productId;
    //// console.log({ validation });
    //!! Checking if the product quantity is 0
    let validation2 = item.quantity <= 0;
    //// console.log({ validation2 });
    return validation && validation2;
  });

  // console.log(!quantity < this.products[subId]?.quantity);

  // console.log({ subId });

  if (subId !== -1) {
    // subId contains the index value of the object like [0] [1]
    this.products.splice(subId, 1);
    await this.save();
  }

  // await this.updateOne({
  //   $pull: {
  //     products: { product: productId, quantity: { $lte: 0 } }, // Remove products where quantity <= 0
  //   },
  // });
  // await this.save();
};
// This middleware is used to update the price of each Individual
// product based on the quantity added
cartSchema.methods.individualPrice = async function () {
  await this.populate("products.product", "price");

  // this.products.forEach((item) => {
  //   item.totalPriceInd = Math.round(item?.quantity * item.product?.price) || 0;
  // });
  this.products.forEach((item) => {
    item.totalPriceInd = item?.quantity * item.product?.price || 0;
    item.totalPriceInd = parseFloat(item.totalPriceInd.toFixed(2));
  });
  // next();
};

// This middleware is used to calculate the total quantity of all products
// in the cart
cartSchema.methods.totalQuantityAll = async function () {
  const quantity = await this.products?.map((item) => {
    return item.quantity;
  });

  this.totalQuantity = quantity.reduce((acc, curr) => acc + curr, 0) || 0;
};

// This middleware is used to calculate the total price of all products in
// the cart
cartSchema.methods.finalCartPrice = async function () {
  const totalPrice = await this.products?.map((item) => {
    return item.totalPriceInd;
  });

  let finalPrice = totalPrice.reduce((acc, curr) => acc + curr, 0);
  this.totalPrice = parseFloat(finalPrice.toFixed(2));
  console.trace(this.totalPrice);
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
