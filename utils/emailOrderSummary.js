const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const { buffer } = require("stream/consumers");
const result = dotenv.config({ path: path.join(__dirname, "../config.env") });

if (result.error) {
  console.error("Error loading .env file", result.error);
}

const generatePDF = (options, finalBill) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4" });
    // passThrough is like a empty channel to pass data, it cant modify the data,
    //  but we can access the data freely and transfer that data wherever we want
    // !! The data can be passed in chunks only.
    const stream = new PassThrough();
    // declaring the buffers here to store the data chunks passed on the "const stream"
    const buffers = [];

    // Making the document data in chunks to pass through the stream here
    doc.pipe(stream);
    // !! Can use npm puppeeteer here to modify the styling of the document.
    doc.text(`${options.message}. The final Amount to pay is ${finalBill}$`);
    doc.end();

    // Pushing that string to the buffers array , and to make sure the push method
    // is called on buffers, we are binding it.
    // !! Binding makes sure the push function is properly called on the buffers array
    // !! rather than the stream or another context.
    // !! Without the binding, push might not behave correctly because the context (this) could be different.
    stream.on("data", buffers.push.bind(buffers));
    // Combining all the data chunks stored in the buffers array into a single Buffer and
    // resolve the promise with the complete data.
    // !! Buffer is a class used to work with binary data directly.
    // !! It allows you to manipulate raw binary data outside the JavaScript string encoding system
    stream.on("end", () =>
      resolve(Buffer.concat(buffers), console.trace("Document Created!"))
    );
    stream.on("error", reject);
  });
};

const sendOrderEmail = async (options, finalBill) => {
  console.trace("Awaiting pdf generation...");
  const pdfBuffer = await generatePDF(options, finalBill);
  console.trace("Finished pdf ");
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
    to: options.email,
    subject: options.subject,
    text: `${options.message}. The final Amount to pay is ${finalBill}`,
    attachments: [
      {
        filename: "order.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
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

module.exports = sendOrderEmail;
