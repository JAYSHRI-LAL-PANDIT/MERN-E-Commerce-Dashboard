const express = require("express");
require("./db/Config");
const User = require("./db/User");
const Product = require("./db/Product");
const cors = require("cors");

const Jwt = require("jsonwebtoken");
const jwtKey = "e-comm";

const app = express();

app.use(cors());
app.use(express.json());
// For register route
app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send({
        result: "Somthing went wrong, Please try after sometime",
      });
    }
    resp.send({ result, auth: token });
  });
});

// For login route
app.post("/login", async (req, resp) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          resp.send({
            result: "Somthing went wrong, Please try after sometime",
          });
        }
        resp.send({ user, auth: token });
      });
    } else {
      resp.send({ result: "No User Found" });
    }
  } else {
    resp.send({ result: "No User Found" });
  }
});
// For product route

app.post("/add-product", verifyToken, async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});
// For product list route
app.get("/products", verifyToken, async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No product found" });
  }
});
// For product delete route

app.delete("/product/:id", verifyToken, async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});
// For one product get route

app.get("/product/:id", verifyToken, async (req, resp) => {
  const result = await Product.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "Product not found" });
  }
});
// For update product put route

app.put("/product/:id", verifyToken, async (req, resp) => {
  const result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  resp.send(result);
});
// For search get route

app.get("/search/:key", verifyToken, async (req, resp) => {
  const result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  resp.send(result);
});

// middleware

function verifyToken(req, resp, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "Please add token with headerf" });
  }
}
app.listen(5000);
