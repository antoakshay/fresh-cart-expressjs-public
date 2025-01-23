const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

const result = dotenv.config({ path: path.join(__dirname, "../config.env") });

if (result.error) {
  console.error("Error loading .env file", result.error);
}
const sendSignUpEmail = (email, OTP) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    to: email,
    subject: "OTP for new account creation ",
    text: `This is the OTP. Expires in 5 minutes ${OTP}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error:", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};
// sendEmail();

module.exports = sendSignUpEmail;
