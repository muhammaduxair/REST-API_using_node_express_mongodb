const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

mongoose
  .connect("mongodb://localhost:27017/api", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Database Have been Successfully Connected"))
  .catch((err) => console.log(err));

//   creating schema
const mySchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(val) {
      if (!validator.isEmail(val)) {
        throw new Error("This Email adress is Already Presented");
      }
    },
  },
  age: {
    type: Number,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// applying middlewares for hashing secure password
mySchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hashPass = await bcrypt.hash(this.password, 10);
    this.password = hashPass;
  }
  next();
});

// craeting model
const MyModel = new mongoose.model("users", mySchema);

module.exports = MyModel;
