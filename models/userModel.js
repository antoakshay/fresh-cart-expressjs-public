const { default: mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    unique: [true, "Email already exists"], // This will ensure that the email is unique
    lowercase: true,
    // Validator npm for e-mail validation
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false, // Avoiding the query results of 'password'
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match",
    },
    select: false, // Avoiding the query results of 'passwoedConfirm'
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loggedOutAt: {
    type: Date,
    default: null,
  },

  role: {
    type: String,
    required: true,
    default: "user",
    enum: ["user", "admin"],
  },
});

// preSave middleware to hash the password before saving it to the database
userSchema.pre("save", async function (next) {
  //if password is not modified, skip this middleware
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12); //save the password in hash
  this.passwordConfirm = undefined;
  next();
  // passwordConfirm field is set to undefined to remove it from the document before saving it to the database.
  //  This is done to prevent the password confirmation field from being stored in the database.
});

// Runs when the user uses the resetPassword feature.
userSchema.pre("save", function (next) {
  //if password is not modified or the user is new, skip this middleware
  if (!this.isModified("password") || this.isNew) return next();

  // When a user changes their password, this middleware sets the passwordChangedAt field.
  // The JWT is  created immediately after the password change.
  // Due to minor time differences (a few seconds between saving the user and creating the token),
  // the passwordChangedAt might appear after the token iat.

  // SO THATS THE REASON WE ARE DEDUCING 100000ms FROM THE Date.now()
  this.passwordChangedAt = Date.now() - 120000; //120seconds
  next();
});

// Instance method to compare the candidate password with the user password in login
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


// Instance method to check if the password was modified
// This middleware is dependent on the .protect() in authController
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // JWT iat is in seconds since the Unix epoch, not milliseconds

    // passwordChangedAt.getTime() gives the time in milliseconds, dividing it by 1000
    // converts it to seconds, matching the format of iat.

    // Dividing by 1000 results in a floating-point number, which is unnecessary for comparison
    //  with iat (an integer). Using parseInt removes the fractional part,
    // ensuring the comparison is precise
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    console.log(
      { changedTimestamp },
      { JWTTimestamp },
      changedTimestamp > JWTTimestamp
    );

    // jwttimestamp is iat;
    return JWTTimestamp < changedTimestamp;
  }

  // returning false if the password was not changed after the JWT was issued
  return false;
};

// Generating the password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // hashing the password reset token and saving it in the dbs
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  // setting the reset token expiry time to 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
