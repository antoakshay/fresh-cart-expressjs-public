// const util = require("util");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const Cart = require("../models/cartModel");
const Session = require("../models/sessionModel");
const { default: mongoose } = require("mongoose");
const UserSignUp = require("../models/userModelSignUp");

dotenv.config({ path: "../config.env" });

// creating the json web token function
const signToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
// SENDING THE JSON web token
const createSendToken = (
  user,
  sessionId,
  statusCode,
  res,
  userName,
  message
) => {
  const token = signToken(user._id, sessionId);
  console.log(process.env.JWT_COOKIE_EXPIRES);
  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "none",
    path: "/",
    secure: true,
  };
  //!! SETTING THE  cookieOptions.secure = false; FOR TESTING PURPOSES, BUT IT
  //!! SHOULD BE CHANGED TO true//!!
  // if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined; //removes the password from the output
  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
      name: userName,
    },
    message: message,
  });
};

exports.signUpOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const exsistingUser = await User.findOne({ email: email });
    if (exsistingUser) {
      throw new Error("User Already exists");
    }
    const newUser = await UserSignUp.create({ email: email });
    await newUser.generateOtp(email);
    await newUser.save();
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.otpVerification = async (req, res) => {
  try {
    const otp = req.body.otp;
    const hashedOtp = await crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");
    const newUser = await UserSignUp.findOne({ signUpOtp: hashedOtp });
    if (!newUser) throw new Error("Invalid OTP");
    const verifyingOtp = await newUser.compareSignUpOtpTime();
    if (!verifyingOtp) throw new Error("OTP expired");

    // !! Creating a temp token, because in the sign-up endpoint,
    // !! WE wont know who he is, (i.e.,) no credentials access
    const tempToken = jwt.sign(
      { email: newUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m", // Token valid for 15 minutes
      }
    );
    console.trace(newUser);
    res.cookie("tempToken", tempToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.status(200).json({
      status: "success",
      token: tempToken,
      message: "OTP verified successfully",
    });
  } catch (e) {
    res.status(400).json({
      status: "fail",

      message: e.message || "Invalid OTP",
    });
  }
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const tempToken = req.cookies.tempToken;
    // console.trace(tempToken);
    if (!tempToken) {
      throw new Error("Unauthorized");
    }
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const email = decoded.email;
    console.trace(email);
    // Making sure that no one signs up as admin//
    const newUser = await User.create({
      name: req.body.name,
      email: email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      // !! Just for testing purposes!!
      // passwordChangedAt: req.body.passwordChangedAt,
    });

    const sessionId = uuidv4();

    const session = new Session({
      user: newUser._id,
      sessionId: sessionId,
    });

    await session.save();

    const newCart = new Cart({
      user: newUser._id,
      products: [],
    });
    // console.trace(newCart instanceof mongoose.Document);
    await newCart.save();
    // !! Clearing the TEMP_JWT Token 
    res.clearCookie("tempToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    createSendToken(newUser, sessionId, 201, res, "User created successfully");
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) check if email and password exist
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }

    // 2) check if user exists && password is correct

    // since the password field is by default neglected in the userModel
    // we need to select it explicitly
    const user = await User.findOne({ email: email }).select("+password +_id ");

    // Accessing the correctPassword instance from the user model, to compare
    // the password entered by the user with the password in the database

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error("Invalid email or password");
    }
    console.log(`USER ID FROM LOGIN ${user._id}`);
    const sessionId = uuidv4();

    const session = new Session({
      sessionId: sessionId,
      user: user._id,
    });
    await session.save();

    const userName = await User.findOne({ email: email }).select("+name");

    // 3) if everything is okay, send token to client

    createSendToken(
      user._id,
      sessionId,
      201,
      res,
      userName.name,
      "User Logged In Successfully"
    );
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message || "Something went wrong",
    });
  }
};

// PROTECT-AUTHORIZATION
exports.protect = async (req, res, next) => {
  try {
    // Getting the token and checking if it exists
    let token;
    let decoded;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // The .split(" ") method splits the string 'Bearer ewefawertq'
      //  at each space into an array: ['Bearer', 'ewefawertq'].
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      // console.trace(req.cookies.jwt);
      token = req.cookies.jwt;
    }
    // console.log(token);

    // If the token does not exist, return immediately.
    if (!token) {
      throw new Error("You are not logged In! Log in to gain access");
    }

    // Verifying the token

    decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // console.log(`DECODE IAT: ${decoded.sessionId}`);

    // Checking if the user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      throw new Error("User belonging to this token doesnt exsist");
    }

    const sessionId = decoded.sessionId;

    const sessionUser = await Session.findOne({
      sessionId: sessionId,
    });

    console.log({ sessionId });

    if (!sessionUser) {
      throw new Error("Session not found");
    }

    // Checking if user changed password after jwt has issued
    // Instance method changedPasswordAfter is defined in the userModel
    if ((await freshUser.changedPasswordAfter(decoded.iat)) === true) {
      throw new Error("User recently changed password. Please log in again");
    }

    // Granting access to the protected route
    req.user = freshUser;
    // Calling the next middleware in stack.
    next();
    console.log("Middleware reached");
  } catch (e) {
    return res.status(401).json({
      status: "fail",
      message: e.message || "Something went wrong",
    });
  }
};

// // TO CHECK IF THE USER IS LOGGED IN
// exports.isLoggedIn = async (req, res, next) => {
//   let token = req.cookies.jwt;
//   if (!token) {
//     return res.status(401).json({
//       status: "fail",
//       message: "You are not logged in! Please log in to access this route",
//     });
//   }
//   next();
// };

// RESTRICTING CERTAIN ACCESS
exports.restrictTo = function (...roles) {
  return function (req, res, next) {
    // roles ["admin"]
    console.log(req.user);
    console.log(req.user?.role);
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// FORGOT-PASSWORD GENERATING RESET TOKEN
exports.forgotPassword = async (req, res, next) => {
  try {
    // Getting the user based on the email address
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      throw new Error("User not found");
    }

    // Accessing the instance method in userModel to generate
    // reset token
    // {SENT THE NON_ENCRYPTED TOKEN}
    const resetToken = await user.createPasswordResetToken();

    if (!resetToken) {
      throw new Error("error creating password reset token");
    }

    // Disabling the validation here to avoid the passwordConfirm action
    // Saving the passwordResetToken in encrypted state
    await user.save({ validateBeforeSave: false });

    // Creating the Reset url and message
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Please click this link to reset your password: ${resetURL}.
     If you didn't request this, please ignore this email.`;

    // Sending the resetEmail
    await sendEmail(
      {
        email: user.email,
        subject: "password reset link valid for 10 mins",
        message,
      }
      // resetToken
    );

    return res.status(200).json({
      status: "success",
      message: "Reset Token generated successfully",
    });
  } catch (err) {
    // If error, resetting the resetToken and expiresAt Values
    const user = await User.findOne({ email: req.body.email });
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "error sending email",
      message: err.message || "Something went wrong",
    });
  }
};

// RESET-PASSWORD
exports.resetPassword = async function (req, res, next) {
  try {
    // Since in the params, the unhashed reset token is sent,
    // re-hashing it to find the user belonging to that token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // Validating the token expire time as speicified in the userModel
    // methods (createResetPasswordToken).
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // Only if token has not expired and there is user , set the new Password
    if (!user) {
      throw new Error("Reset Password Link Expired");
    }

    // Updating the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // Deleting the resetToken and the resetTokenExpires
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Deleting the other logged in sessions when the password is changed
    const deleteExsistingSessions = await Session.deleteMany({
      user: user._id,
    });

    // Saving the user changes
    await user.save();

    // Update changedPasswordAt property for the user
    // Log the user in , send JWT
    // 3) if everything is okay, send token to client

    const sessionId = uuidv4();
    const session = new Session({
      sessionId: sessionId,
      user: user._id,
    });
    await session.save();

    createSendToken(user._id, sessionId, 200, res, "Password reset successful");
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Something went wrong",
    });
  }
};

// UPDATING PASSWORD AFTER LOGGED IN
exports.updatePassword = async (req, res, next) => {
  try {
    // We get the _id from the authController.protect as we grant the user access
    // to protected route
    const user = await User.findById(req.user._id).select("+password");

    // Returning if the currentPassword doesn't match
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      throw new Error("The password doesn't match");
    }

    // Updating the password

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    const deleteExsistingSessions = await Session.deleteMany({
      user: user._id,
    });

    const sessionId = uuidv4();

    const session = new Session({
      sessionId: sessionId,
      user: user._id,
    });
    await session.save();

    createSendToken(
      user._id,
      sessionId,
      200,
      res,
      "Passwords updated successfully"
    );
    next();
  } catch (e) {
    res.status(500).json({
      status: "fail",
      message: e.message || "Something went wrong",
    });
  }
};

// LOGGING OUT USERS
exports.logout = async function (req, res, next) {
  try {
    console.trace(req.cookies.jwt);
    // !! Enable the "req.headers.authorization.split(" ")[1]" if you want to test the,
    // !! logout functionality with post-man.
    let token =
      /* req.headers.authorization.split(" ")[1] || */ req.cookies.jwt;
    //  console.trace(token);
    let decoded = await jwt.verify(token, process.env.JWT_SECRET);
    console.trace(decoded);
    let sessionId = decoded.sessionId;

    const currentSession = await Session.findOne({ sessionId: sessionId });
    if (!sessionId) {
      throw new Error("Session not found");
    }

    const deleteCurrentSession = await Session.findOneAndDelete({
      sessionId: sessionId,
    });
    // !! Clearing the JWT cookies from the browser upon log-out
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
    // next();
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message /* || "Something went wrong" */,
    });
  }
};
