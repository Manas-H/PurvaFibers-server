const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);

router.post("/payment", async (req, res) => {
  console.log(req.body);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr",
      payment_method_data: {
        type: "card",
        card: { token: req.body.tokenId },
      },
      confirm: true,
    });

    res.status(200).json({ success: true, paymentIntent });
  } catch (stripeErr) {
    console.error(stripeErr);
    res.status(500).json({ success: false, message: stripeErr.message });
  }
});

module.exports = router;
