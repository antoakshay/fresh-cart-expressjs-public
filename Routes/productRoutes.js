const express = require("express");
const productController = require("../Controller/productController");
const authController = require("../Controller/authernticationController");

// Router middleware for the products
const productRouter = express.Router();
// productRouter.use(authController.isLoggedIn);
productRouter.get(
  "/allProducts",
  authController.protect,
  productController.getAllProducts
);
productRouter.get(
  "/search",
  authController.protect,
  productController.findProduct
);
productRouter.get(
  "/category/:categoryName",
  authController.protect,
  productController.findCategory
);

productRouter.post(
  "/addProduct",
  authController.protect,
  /*   authController.restrictTo("admin"), */
  productController.addProduct
);
productRouter.patch(
  "/updateProduct/:productId",
  authController.protect,
  authController.restrictTo("admin"),
  productController.updateProduct
);
productRouter.delete(
  "/deleteProduct/:productId",
  authController.protect,
  authController.restrictTo("admin"),
  productController.deleteProduct
);


// !!---------------------------------------------------

productRouter.get(
  "/getCategory",
  authController.protect,
  productController.exploreCategory
);



module.exports = productRouter;
