const router = require("express").Router();
const { User, validate } = require("../models/User");
const bcrypt = require("bcrypt");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
} = require("./verifyToken");
const { decode } = require("jsonwebtoken");
const { application } = require("express");

router.post("/", async (req, res) => {
  // const { name, email, tel, password, reEnterPassword } = req.body;
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (user)
      return res
        .status(409)
        .send({ message: "User with given email already Exist!" });

    // const newUser = await User.create({
    //   name,
    //   email,
    //   tel,
    //   password,
    //   reEnterPassword,
    // });

    // if (newUser) {
    //   res.status(201).json({
    //     _id: newUser._id,
    //     name: newUser.name,
    //     email: newUser.email,
    //     tel: newUser.tel,
    //     password: newUser.password,
    //     reEnterPassword: newUser.reEnterPassword,
    //   });
    // } else {
    //   res.status(400);
    //   throw new Error("Error Occured");
    // }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(
      req.body.password && req.body.reEnterPassword,
      salt
    );

    await new User({
      ...req.body,
      password: hashPassword,
      reEnterPassword: hashPassword,
    }).save();

    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something Went wrong..." });
  }
});


const verifyJWT = (req, res, next ) => {
	const token = req.headers["x-access-token"]?.split('')[1]

	if (token) {
    jwt.verify(token, process.env.JWTPRIVATETOKEN, (err, decode) => {
      if(err) return res.json({
        isLoggedIn : false,
        message : "failed to Authenticate"
      })
      req.user = {};
      req.user.id = decode.id
      req.user.name = decode.name
      next()
    })
  }else{
    re.json({ message: "Incorrect Token Given", isLoggedIn: false })
  }
}

router.get("/getUser", verifyJWT, (req, res) => {
  res.json({ isLoggedIn: true, name: req.user.user})
})

//UPDATE
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  if (req.body.password) {
    req.body.password = CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString();
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET USER
router.get("/find/id",  async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

// router.get("/info", async (req, res) =>{
//   try {
//       const user = await User.findById(req.user._id).select('-password')
//       if(!user) return res.status(400).json({msg: "User does not exist."})

//       res.json(user)
//   } catch (err) {
//       return res.status(500).json({msg: err.message})
//   }
// });

//GET ALL USER
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const users = query
      ? await User.find().sort({ _id: -1 }).limit(5)
      : await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER STATS

router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;