const { default: mongoose } = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const sendSignUpEmail = require("../utils/emailSignUpOtp");

const userSignUpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    lowercase: true,
    // Validator npm for e-mail validation
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  signUpOtp: {
    type: String,
    // select: false, // Avoiding the query results of 'signUpOtp'
  },
  signUpOtpExpiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSignUpSchema.pre("save", async function () {
  if (this.isNew) {
    this.signUpOtpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  }
});

userSignUpSchema.methods.generateOtp = async function (mail) {
  const otp = crypto.randomInt(1000000, 9999999);
  console.trace(otp);
  this.signUpOtp = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  await sendSignUpEmail(mail, otp);
  await this.save();
};

userSignUpSchema.methods.compareSignUpOtpTime = function () {
  // console.trace(Date.now() < this.signUpOtpExpiresAt);
  return Date.now() < this.signUpOtpExpiresAt;
};

const UserSignUp = mongoose.model("UserSignUp", userSignUpSchema);

module.exports = UserSignUp;
