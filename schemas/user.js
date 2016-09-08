var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    phoneNumber: Number,
    profit: Number,
    moneyEarned: Number,
    pricesWhenBought: [{
    	type: mongoose.Schema.Types.ObjectId,
    	ref: 'Stock'
    }],
    pricesNow: [{
    	type: mongoose.Schema.Types.ObjectId,
    	ref: 'Stock'
    }]
});

module.exports = mongoose.model("User", userSchema);