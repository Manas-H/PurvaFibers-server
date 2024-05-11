const router = require('express').Router();
const { spawn } = require('child_process');
const path = require('path');
const { mongoose } = require('../db11');

const Product = mongoose.model('Products');

router.get('/recommendations/:_id', async (req, res) => {
  const { _id } = req.params;
  console.log(req.params._id);
  try {
    console.log("1");
    // Find the product with the given ID in the MongoDB database
    const product = await Product.findById(_id);
    console.log(product);

    console.log("2");
    // If the product doesn't exist, return a 404 error
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    console.log("3");
    // Call the Python script to retrieve the product recommendations
    const pythonScriptPath = path.join(__dirname, '../python-scripts', 'recommendation.py');
    const pythonProcess = spawn('python', [pythonScriptPath, _id]);
    // console.log(__dirname);
    console.log("4");
    let dataBuffer = '';
    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      dataBuffer += data;
    });
    

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      res.status(500).send('An error occurred while retrieving the product recommendations');
    });

    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        try {
          if (dataBuffer.startsWith('{')) {
            const recommendations = JSON.parse(dataBuffer);
            res.json({ recommendations });
          } else {
            console.error(`Error parsing JSON: unexpected data format`);
            console.log(`Raw data: ${dataBuffer}`);
            res.status(500).send('Error parsing JSON');
          }
        } catch (e) {
          console.error(`Error parsing JSON: ${e}`);
          console.log(`Raw data: ${dataBuffer}`);
          res.status(500).send('Error parsing JSON');
        }
      } else {
        console.error(`Python process exited with code ${code}`);
        res.status(500).send('An error occurred while retrieving the product recommendations');
      }
    });
  }catch (error) {
    console.error(error);
    res.status(500).send(`An error occurred while retrieving the product: ${error.message}`);
  }
});

module.exports = router;
