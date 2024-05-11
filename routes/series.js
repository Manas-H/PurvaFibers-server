const router = require("express").Router();
const {Series} = require('../models/Series');


router.get('/', async (req, res) => {
    let series = await Series.find({
    },{_id:0})
    let dataSeries = series;
    res.send(dataSeries);   
});



module.exports = router;