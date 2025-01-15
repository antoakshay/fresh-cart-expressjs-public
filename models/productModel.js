const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
    },
    image: {
      type: String,
      required: false,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    soldOut: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, //Adds the createdAt and updatedAt fields to the schema
  }
);

productSchema.pre("save", async function (next) {
  const placeholder = await fetch(
    "https://placehold.co/400?text=A\nPlaceholder image&font=opensans"
  );
  
});

productSchema.methods.setSoldOut = async function () {
  console.log("SET SOLD OUT RUNNING");
  if (this.quantity === 0) {
    this.quantity = 0;
    this.soldOut = true;
  } else {
    this.soldOut = false;
  }
  await this.save();
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
