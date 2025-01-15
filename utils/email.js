const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

const result = dotenv.config({ path: path.join(__dirname, "../config.env") });

if (result.error) {
  console.error("Error loading .env file", result.error);
}
// console.log(process.env.EMAIL_USERNAME);

const sendEmail = (options, token) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //
  });

  // let token = "asdfaefwerf";

  const mailOptions = {
    to: options.email,
    subject: options.subject,
    text: options.message,
    /*     html: `<h1>Reset Your Password</h1>
    <strong> ${token} </strong>`, */
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

module.exports = sendEmail;
