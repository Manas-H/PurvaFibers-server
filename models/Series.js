const { string } = require('joi');
const mongoose = require('mongoose');

const Series = mongoose.model('Series',{
      Series_id: { type: Number , required: true, unique: true},
      Series_name: { type: String , required: true },
      Image1: { type: String , required: true },
      Image2: { type: String , required: true },
      Series_description: { type: String , required: true },
},);


module.exports = {Series};