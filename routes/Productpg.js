const router = require("express").Router();
const Products = require('../models/Products');


 router.get('/', async (req, res) => {
    let product = await Products.find({
   },{_id:0})
   let productdata = product;
   res.json(productdata);   
});
router.get("/:productid", async (req, res) => {
    try {
       const product = await Products.find({productid: req.params.productid});
        
      res.status(200).json(product);
    } catch (err) {
      res.status(500).json(err);
    }
  });


module.exports = router;