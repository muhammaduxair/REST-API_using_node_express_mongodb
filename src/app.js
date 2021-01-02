require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const MyModel = require("./database/connection");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const port = process.env.PORT;
const static_path = path.join(__dirname, "../public");

// applying middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));
app.use(cookieParser());

app.set("view engine", "hbs");
const view_path = path.join(__dirname, "../templates/views");
app.set("views", view_path);
const partial_path = path.join(__dirname, "../templates/partials");
hbs.registerPartials(partial_path);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/secret", (req, res) => {
  console.log(req.cookies.jwt);
  res.render("secret");
});

app.post("/signup", async (req, res) => {
  try {
    // making jwt token
    const tokenGenerator = jwt.sign(
      { email: req.body.email },
      process.env.SECRET_KEY
    );
    // stroe a token in cookie
    res.cookie("jwt", tokenGenerator, {
      expires: new Date(Date.now() + 120 * 1000),
      httpOnly: true,
    });

    if (req.body.password === req.body.confirm_password) {
      const data = new MyModel({
        fullname: req.body.fullname,
        email: req.body.email,
        age: req.body.age,
        gender: req.body.gender,
        phone: req.body.phone,
        password: req.body.password,
        token: tokenGenerator,
      });
      await data.save();
      res.render("home", {
        message: `${req.body.fullname} Your Regestration has been successfully submited`,
      });
    } else {
      res.status(400).render("signup", {
        message: "Your Password is not Matched",
      });
    }
  } catch (error) {
    res.status(400).render("signup", {
      message: error,
    });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const checker = await MyModel.findOne({ email: req.body.email });
    const passCompare = await bcrypt.compare(
      req.body.password,
      checker.password
    );

    // genrating Autho token using jwt & send it into cookie
    const tokenGenerator = jwt.sign(
      { email: checker.email },
      process.env.SECRET_KEY
    );
    res.cookie("jwt", tokenGenerator, {
      expires: new Date(Date.now() + 120 * 1000),
      httpOnly: true,
    });
    // end token part

    if (req.body.email === checker.email && passCompare) {
      res.render("home", {
        message: `${checker.fullname} You Have Been Successfully Loged In`,
      });
    } else {
      res.render("signin", {
        message: "Invalid Login Details",
      });
    }
  } catch (error) {
    res.status(400).render("signin", {
      message: "Invalid Login Details",
    });
  }
});

// listening server
app.listen(port, () =>
  console.log(`Your Server is Running on http://localhost:${port}`)
);
