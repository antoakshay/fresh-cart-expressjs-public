const express = require("express");
const userController = require("../Controller/userController");
const authenticationController = require("../Controller/authernticationController");

const userRouter = express.Router();

userRouter.post("/signuptest", authenticationController.signUpOtp);
userRouter.post("/verifyOtp", authenticationController.otpVerification);
userRouter.post("/signup", authenticationController.signup);
userRouter.post("/login", authenticationController.login);
userRouter.post(
  "/logout",
  authenticationController.protect,
  authenticationController.logout
);
userRouter.post("/forgotPassword", authenticationController.forgotPassword);
userRouter.patch(
  "/resetPassword/:token",
  authenticationController.resetPassword
);
userRouter.post(
  "/updatePassword",
  authenticationController.protect,
  authenticationController.updatePassword
);

userRouter.get("/allUsers", userController.getAllUsers);

// userRouter.post("/createUser", userController.createUser);
userRouter.delete(
  "/deleteUser/:userId",
  authenticationController.protect,
  userController.deleteUser
);

module.exports = userRouter;
