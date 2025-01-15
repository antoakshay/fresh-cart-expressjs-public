const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: { type:  mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: "String", required: true, unique: true },
  logInTime: { type: Date, default: Date.now },
  logOutTime: { type: Date },
  loggedOut: { type: "Boolean", default: false },
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
