const express = require("express");
const userController = require("../Controller/userController");
const authenticationController = require("../Controller/authernticationController");

const userRouter = express.Router();

userRouter.post("/signup", authenticationController.signUpOtp);
userRouter.post("/verifyOtp", authenticationController.otpVerification);
userRouter.post("/accountCreation", authenticationController.signup);
userRouter.post("/login", authenticationController.login);
userRouter.post(
  "/logout",
  authenticationController.protect,
  authenticationController.logout
);
userRouter.post("/forgotPassword", authenticationController.forgotPassword);

// !! verifying the password reset token first!!
userRouter.post(
  "/resetPasswordVerification",
  authenticationController.resetPasswordVerfiction
);

userRouter.patch(
  "/resetPassword",
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
