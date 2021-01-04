require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const MyModel = require("./database/connection");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// const auth = require("../middleware/auth");

const port = process.env.PORT;
const static_path = path.join(__dirname, "../public");

// applying middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));
app.use(cookieParser());

// app.set("view engine", "hbs");
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

app.get("/secret", async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const jwtVerify = jwt.verify(token, process.env.SECRET_KEY);
    const model = await MyModel.find({ email: jwtVerify.email });
    if (jwtVerify.email === model[0].email) {
      res.status(200).render("secret", {
        name: `${model[0].fullname}`,
        email: `${model[0].email}`,
        message: `${model[0].fullname} You Have Been Successfully Loged In`,
      });
    } else {
      res.status(401).send("Please Login");
    }
  } catch (error) {
    res.render("signup", {
      message: `The Secret Page is Valid For Authorized users Please Create Account or Sign in`,
    });
  }
});

// logout method
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/");
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
      const data = new MyModel(req.body);
      await data.save();
      res.redirect("/secret");
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
      httpOnly: true,
    });
    // end token part

    if (req.body.email === checker.email && passCompare) {
      res.redirect("/secret");
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
