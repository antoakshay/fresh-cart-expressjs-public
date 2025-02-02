const express = require("express");
const https = require("https");
const productRouter = require("./Routes/productRoutes");
const userRouter = require("./Routes/userRoutes");

const cartRouter = require("./Routes/cartRoutes");
const orderRouter = require("./Routes/orderRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitise = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const app = express();

app.use(
  cors({
    origin: [
      "https://localhost:5173",
      "https://192.168.1.46:5173",
      "https://192.168.1.36:5173",
      "https://192.168.177.178:5173",
      "https://192.168.43.117:5173",
    ],
    credentials: true,
  })
);


// GLOBAL MIDDLEWARE HELMET
// To set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for simplicity (optional)
    hsts: false, // Disable HSTS in development
  })
);

// GLOBAL MIDDLEWARE RATE LIMITER
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour.",
});

app.use("/api/v1", limiter);

// middleware to parse JSON requests body
// cant send JSON body in POST without this.
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Data Sanitization against NOSQL query injection
app.use(mongoSanitise());

// Data sanitization against XSS
app.use(xss());

// To prevent parameter pollution
// Eg: Like having two sort parameters
app.use(hpp());

app.use((req, res, next) => {
  // console.log(req.headers);
  // console.trace(req.cookies);
  next();
});

// API ROUTES:
app.use("/api/v1/products", productRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

module.exports = app;
