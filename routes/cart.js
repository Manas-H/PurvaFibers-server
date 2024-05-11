const Cart = require("../models/Cart");
const {
  verifyToken,
  verifyTokenAndAuthorization,
  // verifyTokenAndAdmin,
} = require("./verifyToken");

const router = require("express").Router();

router.post("/addtocart", verifyToken, (req, res) => {
  console.log("this is the body:", req.body);
  // console.log("this is the body:", res);

  try {
    // Check if the request body contains the necessary information
    if (
      !req.body.cartItems ||
      !req.body.cartItems.product ||
      !req.body.cartItems.quantity ||
      !req.body.cartItems.price ||
      !req.body.cartItems.images ||
      !req.body.cartItems.name
    ) {
      // console.log(error);
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Find the user's cart or create a new one if it doesn't exist
    Cart.findOne({ user: req.user._id }).exec((error, cart) => {
      if (error) {
        console.log("this is err :", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (cart) {
        // Update existing cart
        const product = req.body.cartItems.product;
        let condition, update;

        // Check if the product already exists in the cart
        const item = cart.cartItems.find(
          (c) => c.product.toString() == product
        );
        if (item) {
          // If the product exists, update its quantity
          condition = {
            user: req.user._id,
            "cartItems.product": product,
          };
          update = {
            $set: {
              "cartItems.$.quantity":
                item.quantity + req.body.cartItems.quantity,
            },
          };
        } else {
          // If the product doesn't exist, add it to the cart
          condition = { user: req.user._id };
          update = {
            $push: {
              cartItems: req.body.cartItems,
            },
          };
        }

        // Update the cart in the database
        Cart.findOneAndUpdate(condition, update, { new: true }).exec(
          (error, _cart) => {
            if (error) {
              console.log("this is err1 :", error);
              return res.status(500).json({ error: "Internal server error" });
            }
            return res.status(200).json({ cart: _cart });
          }
        );
      } else {
        // Create a new cart if one doesn't exist
        const newCart = new Cart({
          user: req.body.user,
          cartItems: [req.body.cartItems],
        });

        newCart.save((err, cart) => {
          if (err) {
            console.log("this is err3 :", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          return res.status(201).json({ cart });
        });
      }
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedCart);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json("Cart has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET USER CART
router.get("/getcartitem", verifyToken, async (req, res) => {
  console.log("this is body: ", req.user._id);
  try {
    // Find the user's cart and populate the product details
    Cart.findOne({ user: req.user._id })
      .populate("cartItems.product", "_id name price productPictures")
      .exec((error, cart) => {
        if (error) {
          // Handle database error
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!cart) {
          // If cart not found, return 404 Not Found
          return res.status(404).json({ error: "Cart not found" });
        }

        // If cart found, format the cart items and send the response
        let cartItems = {};
        cart.cartItems.forEach((item) => {
          cartItems[item._id.toString()] = {
            _id: item._id.toString(),
            name: item.name,
            price: item.price,
            qty: item.quantity,
            images: item.images
          };
        });
        // console.log(cartItems)
        res.status(200).json({ cartItems });
      });
  } catch (error) {
    // Catch and handle unexpected errors
    console.error("Error fetching cart items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET ALL
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const carts = await Cart.find();
    res.status(200).json(carts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// router.delete("/deletecartitem/:productId", verifyToken, (req, res) => {
//   const productId = req.params.productId;
//   console.log("product: ", productId);

//   if (!productId) {
//     return res.status(400).json({ error: "Product ID is required" });
//   }

//   // Find the user's cart
//   Cart.findOne({ user: req.user._id }).exec((error, cart) => {
//     if (error) {
//       console.log("Error finding cart:", error);
//       return res.status(500).json({ error: "Internal server error" });
//     }
//     if (!cart) {
//       // If cart not found, return 404 Not Found
//       return res.status(404).json({ error: "Cart not found" });
//     }

//     // Remove the product from the cart
//     const updatedCartItems = cart.cartItems.filter(
//       (item) => item.product.toString() !== productId
//     );

//     // Update the cart in the database
//     Cart.findOneAndUpdate(
//       { user: req.user._id },
//       { cartItems: updatedCartItems },
//       { new: true }
//     ).exec((error, _cart) => {
//       if (error) {
//         console.log("Error updating cart:", error);
//         return res.status(500).json({ error: "Internal server error" });
//       }
//       return res
//         .status(200)
//         .json({
//           message: "Product removed from cart successfully",
//           cart: _cart,
//         });
//     });
//   });
// });
router.delete("/deletecartitem/:productId", verifyToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log("product: ", productId);

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Remove the product from the cart
    // console.log("this is cart:", cart.product);
    const updatedProducts = cart.cartItems.filter(
      (item) => item._id.toString() !== productId
    );

    // Update the cart in the database
    const updatedCart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { cartItems: updatedProducts },
      { new: true }
    );

    console.log("Removed product from cart:", updatedCart);

    return res.status(200).json({
      message: "Product removed from cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    console.log("Error removing product from cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
