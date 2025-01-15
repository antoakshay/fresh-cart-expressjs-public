const User = require("../models/userModel");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      message: "This is the list of all users",
      data: { users },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to get users",
      error: err.message,
    });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
      error: err.message,
    });
  }
};
