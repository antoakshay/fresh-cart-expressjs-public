const { default: mongoose } = require("mongoose");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const dotenv = require("dotenv");
const fs = require("fs");
const Cart = require("../models/cartModel");

const DB =
  process.env.DATABASE ||
  "mongodb+srv://antolazarus7:fhgymAVkW9gbansk@cluster0.gcv1w.mongodb.net/fresh-cart?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false,
  })
  .then((con) => {
    // console.log(`Connected to the database: ${con.connection.host}`);
    // console.log(con.connection);
    console.log("Connected to the databaseMongoDB");
  });

// const products = new Product({
//   name: "Wireless Mouse",
//   description: "A sleek, ergonomic wireless mouse with long battery life.",
//   price: 29.99,
//   quantity: 150,
//   category: "Electronics",
//   soldOut: false,
// });

const products = JSON.parse(
  fs.readFileSync(`${__dirname}/productData.json`, "utf8")
);

// const user = {
//   name: "John Doe",
//   email: "johndoe@example.com",
//   password: "password123",
//   passwordConfirm: "password123",
//   role: "user",
// };

const importData = async () => {
  try {
    await Product.create(products);
    // await Cart.create();
    // await User.create(user);
    console.log("Data imported successfully!");
  } catch (error) {
    console.error("Error importing data", error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Product.deleteMany();
    console.log("Data deleted successfully!");
  } catch (error) {
    console.error("Error deleting data", error);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
console.log(process.argv);
