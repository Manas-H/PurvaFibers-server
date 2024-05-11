const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    tel: { type: Number, required: true },
    password: { type: String, required: true },
    reEnterPassword: { type: String, required: true },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: "7d",
  });
  return token;
};

const User = mongoose.model("user", userSchema);

const validate = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().label("Full Name"),
    email: Joi.string().email().required().label("Email"),
    tel: Joi.number().required().label("Mobile Number"),
    password: passwordComplexity().required().label("Password"),
    // reEnterPassword: passwordComplexity().required().label("ReEnter Password"),
    reEnterPassword: Joi.any()
      .valid(Joi.ref("password"))
      .required()
      .label("Password")
      .messages({ "any.only": "{{#label}} does not match" }),
  });
  return schema.validate(data);
};

module.exports = { User, validate };
