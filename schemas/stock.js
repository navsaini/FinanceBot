var mongoose = require('mongoose');

var stockSchema = mongoose.Schema({
	stockName: String,
	stockPrice: Number,
	stockQuantity: Number
});

module.exports = mongoose.model("Stock", stockSchema);