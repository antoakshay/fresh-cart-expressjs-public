const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
// const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");
const PORT = 7000;

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false,
  })
  .then((con) => {
    // console.log(`Connected to the database: ${con.connection.host}`);
    // console.log(con.connection);
    console.log("Connected to the databaseMongoDB");
  });

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

const options = {
  key:"Your KEY goes here",
  cert: "Your cert goes here",
  
  // key: fs.readFileSync("./Keys/omac5g-key.pem"),
  // cert: fs.readFileSync("./Keys/omac 5g.pem"),
};

https.createServer(options, app).listen(7000, "0.0.0.0", () => {
  console.log("App listening on https://localhost:7000");
});
module.exports = app;
