require("dotenv").config();
const express = require("express");
const app = express();

const cors = require("cors");
const connectDB = require("./db11").connectDB;
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const Serie_Route = require("./routes/series");
const Product_Route = require("./routes/Productpg");
const productRoutes = require("./routes/product");
const stripeRoute = require("./routes/stripe");
const recommendationsRouter = require("./routes/api");

// database connection
connectDB()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((error) => {
    console.log(`Error connecting to database: ${error}`);
  });

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        origin === "http://localhost:3000" ||
        origin === "http://your-other-origin.com"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/Series", Serie_Route);
app.use("/api/Product", Product_Route);
app.use("/api/checkout", stripeRoute);
app.use("/api", recommendationsRouter);

const port = process.env.PORT || 5000;
app.listen(port, console.log(`Listening on port ${port}...`));

// const express = require('express');
// const app = express();

// app.get("/api", (req, res) => {
//     res.json({"users" : ["userOne", "userTwo", "userThree"]})
// })

// app.listen(5000, () => { console.log(" server started at the port 5000")})

// import express from 'express';
// import cors from 'cors'
// import mongoose from 'mongoose';
// const express = require('express')
// const cors = require('cors')
// const mongoose = require('mongoose')

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded());
// app.use(cors())

// mongoose.connect("mongodb://localhost:27017/RegisterationDB", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }, () => {
//     console.log("DB Connected");
// });

// const userSchema = mongoose.Schema({
//     name: String,
//     email: String,
//     tel: Number,
//     password: String
// })
